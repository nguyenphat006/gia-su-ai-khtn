import { Prisma, Role, XpAction } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import { hashPassword } from "../utils/password.js";

// ========================
// INCLUDES & TYPES
// ========================

const userInclude = {
  class: true,
  studentProfile: true,
  teacherProfile: true,
  stats: true,
} satisfies Prisma.UserInclude;

type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof userInclude;
}>;

function stripPassword(user: UserWithRelations) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// ========================
// QUERY HELPERS
// ========================

interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  status?: string;
  classId?: string;
}

// ========================
// CRUD OPERATIONS (Admin)
// ========================

/**
 * Lấy danh sách người dùng (có phân trang, tìm kiếm, lọc)
 */
export async function getUsers(query: ListUsersQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  // Lọc theo role
  if (query.role && query.role !== "undefined" as any) {
    where.role = query.role;
  }

  // Lọc theo status
  if (query.status && query.status !== "undefined") {
    where.status = query.status as any;
  }

  // Lọc theo lớp
  if (query.classId && query.classId !== "undefined") {
    where.classId = query.classId;
  }

  // Tìm kiếm theo tên, username, email hoặc mã học sinh
  if (query.search) {
    const search = query.search.trim();
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { displayName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { studentProfile: { studentCode: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: userInclude,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(stripPassword),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Lấy thông tin chi tiết một người dùng theo ID
 */
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: userInclude,
  });

  if (!user) {
    throw new NotFoundError("Không tìm thấy người dùng.");
  }

  return stripPassword(user);
}

/**
 * Admin tạo user mới (Student / Teacher / Admin)
 */
export async function createUser(data: {
  role: Role;
  username: string;
  displayName: string;
  password?: string;
  email?: string;
  classId?: string;
  // Student fields
  studentCode?: string;
  grade?: number;
  // Teacher fields
  employeeCode?: string;
  subject?: string;
}) {
  const username = data.username.trim().toLowerCase().replace(/\s+/g, "");
  if (!username) {
    throw new ValidationError("Tên đăng nhập là bắt buộc.");
  }

  // Kiểm tra trùng username
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    throw new ConflictError("Tên đăng nhập đã tồn tại.");
  }

  // Kiểm tra trùng email
  const email = data.email?.trim().toLowerCase() || null;
  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ConflictError("Email đã được sử dụng.");
    }
  }

  // Kiểm tra trùng mã học sinh
  if (data.studentCode) {
    const code = data.studentCode.trim().toUpperCase();
    const existingCode = await prisma.studentProfile.findUnique({ where: { studentCode: code } });
    if (existingCode) {
      throw new ConflictError("Mã học sinh đã tồn tại.");
    }
  }

  // Validation theo role
  if (data.role === "STUDENT") {
    if (!data.studentCode) {
      // Sinh ma hoc sinh ngau nhien neu thieu
      data.studentCode = `HS${Date.now().toString().slice(-6)}`;
    }
    if (!data.grade || data.grade < 6 || data.grade > 9) {
      data.grade = 6; // Default khoi 6 neu thieu hoac sai
    }
  }

  // Kiểm tra classId hợp lệ
  if (data.classId) {
    const cls = await prisma.class.findUnique({ where: { id: data.classId } });
    if (!cls) {
      throw new NotFoundError("Không tìm thấy lớp học.");
    }
  }

  const isDefaultPassword = (data.password || "123456") === "123456";
  const passwordHash = await hashPassword(data.password || "123456", !isDefaultPassword);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      displayName: data.displayName.trim(),
      passwordHash,
      role: data.role,
      status: "ACTIVE",
      mustChangePassword: true,
      classId: data.classId || null,
      studentProfile: data.role === "STUDENT" ? {
        create: {
          studentCode: data.studentCode!.trim().toUpperCase(),
          grade: data.grade!,
        }
      } : undefined,
      teacherProfile: data.role !== "STUDENT" ? {
        create: {
          employeeCode: data.employeeCode?.trim() || null,
          subject: data.subject?.trim() || null,
        }
      } : undefined,
      stats: data.role === "STUDENT" ? { create: {} } : undefined,
    },
    include: userInclude,
  });

  return stripPassword(user);
}

/**
 * Admin cập nhật thông tin user
 */
export async function updateUserByAdmin(id: string, data: {
  displayName?: string;
  email?: string;
  role?: Role;
  status?: string;
  classId?: string | null;
  // Student fields
  studentCode?: string;
  grade?: number;
  // Teacher fields
  employeeCode?: string;
  subject?: string;
  // Reset password
  password?: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: userInclude,
  });

  if (!existingUser) {
    throw new NotFoundError("Không tìm thấy người dùng.");
  }

  // Kiểm tra trùng email nếu đổi
  if (data.email !== undefined) {
    const email = data.email?.trim().toLowerCase() || null;
    if (email) {
      const dup = await prisma.user.findFirst({ where: { email, NOT: { id } } });
      if (dup) {
        throw new ConflictError("Email đã được sử dụng.");
      }
    }
  }

  // Chuẩn bị dữ liệu update cho User
  const userUpdate: Prisma.UserUpdateInput = {};
  if (data.displayName !== undefined) userUpdate.displayName = data.displayName.trim();
  if (data.email !== undefined) userUpdate.email = data.email?.trim().toLowerCase() || null;
  if (data.role !== undefined) userUpdate.role = data.role;
  if (data.status !== undefined) userUpdate.status = data.status as any;
  if (data.classId !== undefined) {
    userUpdate.class = data.classId
      ? { connect: { id: data.classId } }
      : { disconnect: true };
  }
  if (data.password) {
    const isDefaultPassword = data.password === "123456";
    userUpdate.passwordHash = await hashPassword(data.password, !isDefaultPassword);
    userUpdate.mustChangePassword = true;
  }

  // Update Student Profile
  if (existingUser.studentProfile && (data.studentCode || data.grade)) {
    await prisma.studentProfile.update({
      where: { userId: id },
      data: {
        ...(data.studentCode && { studentCode: data.studentCode.trim().toUpperCase() }),
        ...(data.grade && { grade: data.grade }),
      },
    });
  }

  // Update Teacher Profile
  if (existingUser.teacherProfile && (data.employeeCode !== undefined || data.subject !== undefined)) {
    await prisma.teacherProfile.update({
      where: { userId: id },
      data: {
        ...(data.employeeCode !== undefined && { employeeCode: data.employeeCode?.trim() || null }),
        ...(data.subject !== undefined && { subject: data.subject?.trim() || null }),
      },
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: userUpdate,
    include: userInclude,
  });

  return stripPassword(updatedUser);
}

/**
 * Admin xóa nhiều users
 */
export async function deleteUsers(ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError("Danh sách ID không hợp lệ.");
  }

  const result = await prisma.user.deleteMany({ where: { id: { in: ids } } });

  if (result.count === 0) {
    throw new NotFoundError("Không tìm thấy người dùng nào để xóa.");
  }

  return { message: `Xóa thành công ${result.count} người dùng.` };
}

// ========================
// PROFILE UPDATE (Self)
// ========================

/**
 * Người dùng tự cập nhật hồ sơ cá nhân
 */
export async function updateMyProfile(userId: string, data: {
  displayName?: string;
  avatarUrl?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });

  if (!user) {
    throw new NotFoundError("Không tìm thấy người dùng.");
  }

  // Update displayName trên bảng User
  if (data.displayName !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { displayName: data.displayName.trim() },
    });
  }

  // Update avatarUrl trên profile tương ứng
  if (data.avatarUrl !== undefined) {
    if (user.studentProfile) {
      await prisma.studentProfile.update({
        where: { userId },
        data: { avatarUrl: data.avatarUrl },
      });
    } else if (user.teacherProfile) {
      await prisma.teacherProfile.update({
        where: { userId },
        data: { avatarUrl: data.avatarUrl },
      });
    }
  }

  // Trả về user đã cập nhật
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });

  return stripPassword(updatedUser!);
}

/**
 * Chuyển đổi tên Tiếng Việt có dấu thành username không dấu, viết liền
 */
export function generateUsername(displayName: string) {
  return displayName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Sinh dữ liệu hoạt động giả lập cho User (XP, Streak, Logs, Chat)
 */
export async function seedUserActivity(userId: string, options?: { xpMarch?: number, xpApril?: number, xpMay?: number, maxStreak?: number }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true, stats: true }
  });

  if (!user || user.role !== "STUDENT") return;

  const now = new Date();
  
  // Tính toán XP theo yêu cầu của giáo viên hoặc dùng mặc định
  const maxMar = options?.xpMarch || 250;
  const maxApr = options?.xpApril || 500;
  const maxMay = options?.xpMay || 550;
  const maxStreak = options?.maxStreak || 4;

  const xpMarch = Math.floor(Math.random() * (maxMar * 0.8)) + (maxMar * 0.2); 
  const xpApril = Math.floor(Math.random() * (maxApr * 0.8)) + (maxApr * 0.2);
  const xpMay = Math.floor(Math.random() * (maxMay * 0.8)) + (maxMay * 0.2);
  
  const totalXp = Math.floor(xpMarch + xpApril + xpMay);
  const randomStreak = Math.floor(Math.random() * maxStreak) + 1; 
  
  const randomWins = Math.floor(Math.random() * 20) + 5;
  const randomTotal = randomWins + Math.floor(Math.random() * 10);

  // 1. Cập nhật Stats
  await prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      totalXp: totalXp,
      weeklyXp: Math.floor(xpMay * 0.5), // XP tuần này lấy từ 1 phần tháng 5
      currentStreak: randomStreak,
      longestStreak: randomStreak,
      lastStudyDate: now,
    },
    update: {
      totalXp: totalXp,
      weeklyXp: Math.floor(xpMay * 0.5),
      currentStreak: randomStreak,
      longestStreak: randomStreak,
      lastStudyDate: now,
    }
  });

  // 2. Tạo XpLog giả (Phân bổ theo 3 tháng: 3, 4, 5 năm 2026)
  const logsData: any[] = [];
  
  // Helper tạo logs cho 1 tháng
  const generateMonthlyLogs = (month: number, totalAmount: number) => {
    const count = 3 + Math.floor(Math.random() * 4);
    const isCurrentMonth = (now.getFullYear() === 2026 && now.getMonth() === month - 1);
    const maxDay = isCurrentMonth ? now.getDate() : 28;

    for (let i = 0; i < count; i++) {
      const logDate = new Date(2026, month - 1, Math.floor(Math.random() * maxDay) + 1);
      logDate.setHours(Math.floor(Math.random() * 12) + 8);
      logsData.push({
        userId,
        amount: Math.max(1, Math.floor(totalAmount / count)),
        action: XpAction.COMPLETE_QUIZ,
        createdAt: logDate
      });
    }
  };

  generateMonthlyLogs(3, xpMarch);
  generateMonthlyLogs(4, xpApril);
  generateMonthlyLogs(5, xpMay);

  await prisma.xpLog.createMany({ data: logsData });

  // 3. Tạo Arena Results giả
  const arenaCount = 5 + Math.floor(Math.random() * 8);
  const arenaData = [];
  const topics = ["Động vật", "Thực vật", "Cơ năng", "Nhiệt học", "Hóa học hữu cơ", "Tế bào", "Quang hợp", "Hệ mặt trời"];
  for (let i = 0; i < arenaCount; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 10);
    const matchDate = new Date();
    matchDate.setDate(now.getDate() - randomDaysAgo);
    matchDate.setHours(Math.floor(Math.random() * 12) + 8);
    
    const mode = Math.random() > 0.5 ? "PVP" : "AI";
    arenaData.push({
      userId,
      topic: topics[Math.floor(Math.random() * topics.length)],
      mode,
      opponent: mode === "AI" ? "Gia sư AI" : "Bạn học ẩn danh",
      score: Math.floor(Math.random() * 150) + 100,
      winner: Math.random() > 0.3,
      xpEarned: Math.floor(Math.random() * 50) + 20,
      createdAt: matchDate
    });
  }
  await prisma.arenaResult.createMany({ data: arenaData });

  // 4. Tạo Chat Sessions & Messages giả (Nội dung tự nhiên hơn)
  const chatSessionsCount = 3 + Math.floor(Math.random() * 4);
  const chatContents = [
    { q: "Cô ơi, lực đẩy Ác-si-mét phụ thuộc vào những yếu tố nào ạ?", a: "Chào em! Lực đẩy Ác-si-mét phụ thuộc vào hai yếu tố chính: trọng lượng riêng của chất lỏng ($d$) và thể tích của phần chất lỏng bị vật chiếm chỗ ($V$). Công thức là $F_A = d.V$ em nhé." },
    { q: "Em chưa hiểu rõ về cấu tạo của tế bào nhân thực, cô giải thích lại giúp em với.", a: "Tế bào nhân thực rất thú vị! Nó gồm 3 phần chính: màng sinh chất, tế bào chất và quan trọng nhất là nhân có màng bao bọc chứa vật chất di truyền." },
    { q: "Tại sao lá cây lại có màu xanh lục hả cô?", a: "Đó là nhờ chất diệp lục (chlorophyll) nằm trong lục lạp của tế bào lá đấy. Diệp lục giúp cây hấp thụ năng lượng ánh sáng mặt trời để thực hiện quá trình quang hợp." },
    { q: "Cho em xin công thức tính công suất điện lớp 9 với ạ.", a: "Công suất điện ($P$) của một đoạn mạch bằng tích của hiệu điện thế ($U$) giữa hai đầu đoạn mạch và cường độ dòng điện ($I$) chạy qua đoạn mạch đó: $P = U.I$. Đơn vị là Oát ($W$)." },
    { q: "Hiện tượng khúc xạ ánh sáng là gì vậy cô?", a: "Khúc xạ ánh sáng là hiện tượng tia sáng truyền từ môi trường trong suốt này sang môi trường trong suốt khác bị gãy khúc tại mặt phân cách giữa hai môi trường." },
    { q: "Cô ơi, axit sunfuric đặc có tính chất gì đặc biệt không ạ?", a: "Axit sunfuric đặc ($H_2SO_4$ đặc) có tính háo nước rất mạnh và tính oxy hóa rất mạnh. Em cần hết sức cẩn thận khi làm thí nghiệm với chất này nhé!" },
    { q: "Làm sao để phân biệt được động vật không xương sống và động vật có xương sống?", a: "Dấu hiệu cơ bản nhất chính là bộ xương trong, mà đặc điểm quan trọng là cột sống chứa tủy sống. Động vật có xương sống luôn có cột sống, còn nhóm kia thì không em nhé." }
  ];

  for (let i = 0; i < chatSessionsCount; i++) {
    const sessionDate = new Date(now.getTime() - Math.random() * 86400000 * 10);
    const session = await prisma.chatSession.create({
      data: {
        userId,
        title: "Trao đổi bài học KHTN",
        createdAt: sessionDate
      }
    });

    // Chọn ngẫu nhiên 1-2 cặp câu hỏi cho mỗi session
    const numMessages = Math.random() > 0.7 ? 2 : 1;
    const usedIndices = new Set();
    
    for(let j = 0; j < numMessages; j++) {
      let idx;
      do { idx = Math.floor(Math.random() * chatContents.length); } while(usedIndices.has(idx));
      usedIndices.add(idx);
      
      const qa = chatContents[idx];
      const msgTime = new Date(sessionDate.getTime() + j * 60000);
      
      await prisma.chatMessage.createMany({
        data: [
          { sessionId: session.id, role: "USER", content: qa.q, createdAt: msgTime },
          { sessionId: session.id, role: "MODEL", content: qa.a, createdAt: new Date(msgTime.getTime() + 15000) }
        ]
      });
    }
  }
}

/**
 * Import nhiều users cùng lúc (Batch Import)
 */
export async function batchImportUsers(usersData: any[], seedActivity = false, seedOptions?: any) {
  const results = {
    success: 0,
    errors: [] as { index: number; username: string; reason: string }[],
  };

  for (let i = 0; i < usersData.length; i++) {
    const data = usersData[i];
    try {
      const user = await createUser({
        role: data.role || "STUDENT",
        username: data.username,
        displayName: data.displayName,
        password: data.password || "123456",
        email: data.email,
        classId: data.classId,
        studentCode: data.studentCode,
        grade: data.grade ? Number(data.grade) : undefined,
      });
      
      if (seedActivity && user.role === "STUDENT") {
        await seedUserActivity(user.id, seedOptions);
      }
      
      results.success++;
    } catch (error: any) {
      results.errors.push({
        index: i + 1,
        username: data.username || "Không xác định",
        reason: error.message || "Lỗi không xác định",
      });
    }
  }

  return results;
}

