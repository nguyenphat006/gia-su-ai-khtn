import { Server, Socket } from "socket.io";

// ==================================================
// IN-MEMORY STATE (Trạng thái lưu trong RAM)
// ==================================================
const players = new Map<string, any>();
const matchmakingQueue: string[] = [];
const activeBattles = new Map<string, any>();

// ==================================================
// SETUP SOCKET.IO CHO ĐẤU TRƯỜNG TRÍ TUỆ
// ==================================================
export function setupArenaSockets(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("⚔️  User connected to Arena:", socket.id);

    // ------- THAM GIA LOBBY -------
    socket.on("join-lobby", (username: string) => {
      players.set(socket.id, {
        id: socket.id,
        username,
        score: 0,
        status: "idle",
      });
      io.emit("players-update", Array.from(players.values()));
    });

    // ------- GỬI LỜI THÁCH ĐẤU -------
    socket.on("send-challenge", ({ targetUsername }) => {
      const challenger = players.get(socket.id);
      if (!challenger || challenger.status !== "idle") return;

      const targetPlayer = Array.from(players.values()).find(
        (p) => p.username === targetUsername
      );
      if (
        targetPlayer &&
        targetPlayer.status === "idle" &&
        targetPlayer.id !== socket.id
      ) {
        targetPlayer.status = "matching";
        challenger.status = "matching";
        io.to(targetPlayer.id).emit("challenge-received", { challenger });
        io.to(socket.id).emit("challenge-sent", { target: targetPlayer });
      } else {
        io.to(socket.id).emit("challenge-error", {
          message: "Chiến binh không online hoặc đang bận.",
        });
      }
      io.emit("players-update", Array.from(players.values()));
    });

    // ------- CHẤP NHẬN / TỪ CHỐI LỜI THÁCH ĐẤU -------
    socket.on("accept-challenge", ({ challengerId }) => {
      const p1 = players.get(challengerId);
      const p2 = players.get(socket.id);
      if (p1 && p2) {
        io.to(challengerId).emit("challenge-accepted", { opponent: p2 });
      }
    });

    socket.on("reject-challenge", ({ challengerId }) => {
      const p1 = players.get(challengerId);
      const p2 = players.get(socket.id);
      if (p1) {
        p1.status = "idle";
        io.to(challengerId).emit("challenge-rejected");
      }
      if (p2) p2.status = "idle";
      io.emit("players-update", Array.from(players.values()));
    });

    // ------- CẤU HÌNH TRẬN ĐẤU -------
    socket.on("send-challenge-config", ({ targetId, config }) => {
      io.to(targetId).emit("challenge-config-received", {
        config,
        challengerId: socket.id,
      });
    });

    socket.on("accept-config", ({ opponentId, config }) => {
      const p1 = players.get(opponentId);
      const p2 = players.get(socket.id);

      if (p1 && p2) {
        const battleId = `battle-${p1.id}-${p2.id}`;
        p1.status = "in-battle";
        p2.status = "in-battle";

        activeBattles.set(battleId, {
          id: battleId,
          players: [p1, p2],
          scores: { [p1.id]: 0, [p2.id]: 0 },
          answers: {} as Record<string, any>,
          finished: { [p1.id]: false, [p2.id]: false },
        });

        io.to(p1.id).emit("match-found", {
          battleId,
          opponent: p2,
          config,
        });
        io.to(p2.id).emit("match-found", {
          battleId,
          opponent: p1,
          config,
        });
        io.emit("players-update", Array.from(players.values()));
      }
    });

    socket.on("reject-config", ({ opponentId }) => {
      io.to(opponentId).emit("config-rejected");
    });

    socket.on("cancel-challenge-flow", ({ targetId }) => {
      const p1 = players.get(socket.id);
      const p2 = players.get(targetId);
      if (p1) p1.status = "idle";
      if (p2) p2.status = "idle";
      io.to(targetId).emit("challenge-flow-cancelled");
      io.emit("players-update", Array.from(players.values()));
    });

    // ------- MATCHMAKING TỰ ĐỘNG -------
    socket.on("find-match", () => {
      const player = players.get(socket.id);
      if (!player || player.status !== "idle") return;

      player.status = "matching";
      matchmakingQueue.push(socket.id);

      if (matchmakingQueue.length >= 2) {
        const p1Id = matchmakingQueue.shift()!;
        const p2Id = matchmakingQueue.shift()!;
        const p1 = players.get(p1Id);
        const p2 = players.get(p2Id);

        if (p1 && p2) {
          const battleId = `battle-${p1Id}-${p2Id}`;
          p1.status = "in-battle";
          p2.status = "in-battle";

          activeBattles.set(battleId, {
            id: battleId,
            players: [p1, p2],
            scores: { [p1Id]: 0, [p2Id]: 0 },
            answers: {} as Record<string, any>,
            finished: { [p1Id]: false, [p2Id]: false },
          });

          io.to(p1Id).emit("match-found", { battleId, opponent: p2 });
          io.to(p2Id).emit("match-found", { battleId, opponent: p1 });
        }
      }
      io.emit("players-update", Array.from(players.values()));
    });

    socket.on("cancel-match", () => {
      const index = matchmakingQueue.indexOf(socket.id);
      if (index !== -1) matchmakingQueue.splice(index, 1);
      const player = players.get(socket.id);
      if (player) player.status = "idle";
      io.emit("players-update", Array.from(players.values()));
    });

    // ------- XỬ LÝ CÂU TRẢ LỜI TRONG TRẬN ĐẤU -------
    socket.on(
      "submit-battle-answer",
      ({ battleId, questionIdx, correct, timeLeft }) => {
        const battle = activeBattles.get(battleId);
        if (!battle) return;

        if (!battle.answers[questionIdx]) {
          battle.answers[questionIdx] = {};
        }
        battle.answers[questionIdx][socket.id] = { correct, timeLeft };

        // Nếu cả 2 người chơi đã trả lời câu này -> Tính điểm!
        const p1Id = battle.players[0].id;
        const p2Id = battle.players[1].id;
        const ans1 = battle.answers[questionIdx][p1Id];
        const ans2 = battle.answers[questionIdx][p2Id];

        if (ans1 && ans2) {
          if (ans1.correct && ans2.correct) {
            // Cả 2 đúng -> Ai nhanh hơn được 5 điểm
            if (ans1.timeLeft > ans2.timeLeft) {
              battle.scores[p1Id] += 5;
            } else if (ans2.timeLeft > ans1.timeLeft) {
              battle.scores[p2Id] += 5;
            } else {
              // Hòa -> Cả 2 đều được 5 điểm
              battle.scores[p1Id] += 5;
              battle.scores[p2Id] += 5;
            }
          } else if (ans1.correct && !ans2.correct) {
            battle.scores[p1Id] += 5;
          } else if (!ans1.correct && ans2.correct) {
            battle.scores[p2Id] += 5;
          }
          io.to(p1Id)
            .to(p2Id)
            .emit("battle-update", { scores: battle.scores });
        }
      }
    );

    // ------- KẾT THÚC TRẬN ĐẤU -------
    socket.on("finish-battle", ({ battleId }) => {
      const battle = activeBattles.get(battleId);
      if (!battle) return;

      battle.finished[socket.id] = true;
      if (Object.values(battle.finished).every((v) => v)) {
        io.to(battle.players[0].id)
          .to(battle.players[1].id)
          .emit("battle-finished", { scores: battle.scores });
        battle.players.forEach((p: any) => {
          const player = players.get(p.id);
          if (player) player.status = "idle";
        });
        activeBattles.delete(battleId);
        io.emit("players-update", Array.from(players.values()));
      }
    });

    // ------- NGẮT KẾT NỐI -------
    socket.on("disconnect", () => {
      const index = matchmakingQueue.indexOf(socket.id);
      if (index !== -1) matchmakingQueue.splice(index, 1);
      players.delete(socket.id);
      io.emit("players-update", Array.from(players.values()));
      console.log("👋 User disconnected from Arena:", socket.id);
    });
  });
}
