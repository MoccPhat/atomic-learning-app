export type PetSpecies = 'dog' | 'cat' | 'turtle' | 'fish' | 'capybara' | 'hamster';
export type PetStage = 'baby' | 'teen' | 'adult' | 'master';
export type PetMood = 'focusing' | 'sleeping' | 'happy' | 'hungry' | 'celebrating' | 'idle' | 'resting';

export interface PetData {
  id: string;
  species: PetSpecies;
  name: string;
  level: number;
  exp: number;
  maxExp: number;
  stage: PetStage;
  hunger: number; // 0 - 100 (100 là no nê)
  happiness: number; // 0 - 100 (100 là cực kỳ vui)
  totalFocusMinutes: number;
  createdAt: string;
  lastFedAt?: string;
}

export interface FocusPetState {
  activeSpecies: PetSpecies;
  pets: Record<PetSpecies, PetData>;
  treats: number; // Hạt dinh dưỡng tích lũy từ các phiên Pomodoro
  unlockedSpecies: PetSpecies[];
  updatedAt: string;
}

export interface PetSpeciesInfo {
  species: PetSpecies;
  name: string;
  vietnameseName: string;
  emoji: string;
  description: string;
  trait: string;
  favoriteFood: string;
  foodEmoji: string;
  bgGradient: string;
  borderColor: string;
  quotes: {
    focusing: string[];
    idle: string[];
    celebrating: string[];
    resting: string[];
    hungry: string[];
  };
}

export const PET_SPECIES_CONFIG: Record<PetSpecies, PetSpeciesInfo> = {
  dog: {
    species: 'dog',
    name: 'Shiba Trung Thành',
    vietnameseName: 'Chó Shiba',
    emoji: '🐕',
    description: 'Người bạn trung thành, luôn hào hứng cổ vũ bạn vượt qua mọi trang sách khó!',
    trait: 'Nhiệt huyết & Trung thành',
    favoriteFood: 'Khúc xương năng lượng',
    foodEmoji: '🍖',
    bgGradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
    borderColor: 'border-amber-400 dark:border-amber-600',
    quotes: {
      focusing: ['Gâu! Đang học chăm quá, em ngồi ngoan cạnh bạn nhé!', 'Cố lên bạn ơi, 1 trang sách nữa thôi!', 'Shiba tin bạn làm được mà!'],
      idle: ['Gâu gâu! Khi nào chúng mình bắt đầu học phiên mới thế?', 'Em đã chuẩn bị sẵn sàng rồi đây!'],
      celebrating: ['Gâu tuyệt vời! Hoàn thành xuất sắc phiên học rồi! Woof woof!', 'Bạn cừ khôi thật đấy!'],
      resting: ['Giờ giải lao rồi, đi uống ngụm nước và xoa đầu em nào!', 'Nghỉ ngơi chút lấy sức nhé!'],
      hungry: ['Bụng em sôi ọt ẹt rồi nè, cho em xin 1 khúc xương đi!', 'Học xong thưởng em chút đồ ăn nha!'],
    },
  },
  cat: {
    species: 'cat',
    name: 'Mèo Mướp Calico',
    vietnameseName: 'Mèo Calico',
    emoji: '🐱',
    description: 'Điềm tĩnh và ấm áp. Mèo sẽ cuộn tròn ngủ ngoan để không làm bạn xao nhãng.',
    trait: 'Điềm tĩnh & Tĩnh lặng',
    favoriteFood: 'Cá hồi thượng hạng',
    foodEmoji: '🐟',
    bgGradient: 'from-rose-500/10 to-pink-500/10 dark:from-rose-500/20 dark:to-pink-500/20',
    borderColor: 'border-rose-400 dark:border-rose-600',
    quotes: {
      focusing: ['Meo~ Cứ yên tâm học đi, em ngủ ngoan cạnh bàn nè...', 'Tiếng lật sách của bạn nghe êm tai ghê...', 'Đừng nhìn màn hình điện thoại nha meo!'],
      idle: ['Meo? Bạn đã sẵn sàng mở sách chưa đó?', 'Em vừa chợp mắt xong, học thôi nào!'],
      celebrating: ['Meowww! Bạn giỏi lắm, em tự hào về bạn ghê!', 'Hoàn thành rồi, xoa cằm cho em đi!'],
      resting: ['Nghỉ ngơi vươn vai như loài mèo nào meo!', 'Uống chút nước ấm đi bạn ơi!'],
      hungry: ['Meo... đĩa cá của em hết sạch rồi nè bạn ơi!', 'Em cần nạp năng lượng meo meo!'],
    },
  },
  turtle: {
    species: 'turtle',
    name: 'Rùa Thông Thái',
    vietnameseName: 'Rùa Xanh',
    emoji: '🐢',
    description: 'Chậm mà chắc! Biểu tượng của tính kiên định, kỷ luật thép trước mọi kỳ thi lớn.',
    trait: 'Kiên định & Sâu sắc',
    favoriteFood: 'Lá sen thanh tịnh',
    foodEmoji: '🍃',
    bgGradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
    borderColor: 'border-emerald-400 dark:border-emerald-600',
    quotes: {
      focusing: ['Chậm mà chắc, từng bước một ta sẽ đến đỉnh vinh quang.', 'Tập trung sâu là chìa khóa của trí tuệ.', 'Đừng vội vã, hiểu bản chất mới là cốt lõi.'],
      idle: ['Vạn dặm bắt đầu từ một bước chân. Bạn đã sẵn sàng chưa?'],
      celebrating: ['Rùa già chúc mừng bạn! Kiến thức hôm nay đã ngấm sâu vào tâm trí.', 'Xuất sắc lắm, bước tiến vững chãi!'],
      resting: ['Thư giãn đôi mắt, hít thở chậm rãi như loài rùa ngàn năm.', 'Hãy để não bộ tiêu hóa kiến thức.'],
      hungry: ['Bác rùa cần chút rau xanh để dưỡng trí tuệ...', 'Cho bác một chiếc lá sen nhé bạn trẻ.'],
    },
  },
  fish: {
    species: 'fish',
    name: 'Cá Vàng May Mắn',
    vietnameseName: 'Cá Vàng Vây Lụa',
    emoji: '🐟',
    description: 'Bơi lượn thong thả trong bể thủy tinh trong veo, xua tan mọi căng thẳng áp lực.',
    trait: 'Thư thái & Dẻo dai',
    favoriteFood: 'Hạt rong biển phát sáng',
    foodEmoji: '🫧',
    bgGradient: 'from-sky-500/10 to-cyan-500/10 dark:from-sky-500/20 dark:to-cyan-500/20',
    borderColor: 'border-sky-400 dark:border-sky-600',
    quotes: {
      focusing: ['Ục ục... Em bơi nhẹ nhàng theo dòng suy nghĩ của bạn...', 'Giữ tâm trí trong trẻo như làn nước mát nha!', 'Cứ trôi mượt mà cùng kiến thức nhé!'],
      idle: ['Bể nước đã trong veo rồi, cùng bơi vào biển học thôi!', 'Ục ục, bắt đầu phiên mới nào!'],
      celebrating: ['Nhảy lên khỏi mặt nước chúc mừng bạn nè! Ục ục!', 'Một phiên học trôi chảy tuyệt vời!'],
      resting: ['Thả lỏng cơ thể như cá trôi theo dòng nước nào.', 'Nghỉ giải lao ngắm em bơi chút nhé!'],
      hungry: ['Mặt nước lặng quá, thả cho em vài hạt thức ăn đi bạn!', 'Em đói bụng rồi ục ục...'],
    },
  },
  capybara: {
    species: 'capybara',
    name: 'Capybara Thong Dong',
    vietnameseName: 'Capybara Điềm Tĩnh',
    emoji: '🦫',
    description: 'Chiến thần ngoại giao, đội quả cam trên đầu, bình thản trước mọi hạn nộp bài!',
    trait: 'Bình thản & Zen',
    favoriteFood: 'Quả cam ngọt mọng nước',
    foodEmoji: '🍊',
    bgGradient: 'from-amber-600/10 to-yellow-500/10 dark:from-amber-600/20 dark:to-yellow-500/20',
    borderColor: 'border-amber-500 dark:border-amber-700',
    quotes: {
      focusing: ['Hít thở sâu... Mọi deadline rồi cũng sẽ qua, cứ bình thản học thôi.', 'Capybara giữ quả cam thăng bằng cùng bạn tập trung.', 'Tâm bất biến giữa dòng đời vạn biến.'],
      idle: ['Capybara đang ngâm bồn nước ấm đây. Vào học cùng tớ nhé?'],
      celebrating: ['Tuyệt hảo! Tớ rung rinh quả cam chúc mừng bạn đây!', 'Đỉnh nóc kịch trần, phong thái rất chi là điềm đạm!'],
      resting: ['Nghỉ ngơi nào, làm ly trà ấm như tớ ngâm suối nước nóng.', 'Thư giãn tuyệt đối nhé người bạn!'],
      hungry: ['Quả cam trên đầu để ngắm thôi chứ tớ đói bụng rồi nè...', 'Thưởng cho Capybara chút đồ ăn đi mà!'],
    },
  },
  hamster: {
    species: 'hamster',
    name: 'Chuột Lang Má Phính',
    vietnameseName: 'Chuột Lang Hamster',
    emoji: '🐹',
    description: 'Năng nổ, siêu đáng yêu với đôi má phúng phính gom nhặt từng hạt tri thức quý giá.',
    trait: 'Năng nổ & Chăm chỉ',
    favoriteFood: 'Hạt hướng dương giòn tan',
    foodEmoji: '🌻',
    bgGradient: 'from-orange-400/10 to-amber-400/10 dark:from-orange-400/20 dark:to-amber-400/20',
    borderColor: 'border-orange-400 dark:border-orange-600',
    quotes: {
      focusing: ['Chít chít! Gom từng chút kiến thức vào má như gom hạt hướng dương!', 'Em đang quay bánh xe tập trung cổ vũ bạn đây!', 'Chăm chỉ mỗi ngày sẽ có kho tri thức khổng lồ!'],
      idle: ['Má em đang rỗng nè, cùng học để gom thật nhiều hạt nào!', 'Chít chít! Học thôi bạn ơi!'],
      celebrating: ['Yeeey! Hai má em phồng to vì vui sướng chúc mừng bạn nè!', 'Bạn chăm chỉ nhất quả đất!'],
      resting: ['Nghỉ tay nhai hạt hướng dương cùng em nào chít chít!', 'Vươn vai chút xíu cho đỡ mỏi lưng nha!'],
      hungry: ['Hai má em lép kẹp rồi nè, cho em xin hạt hướng dương đi!', 'Đói meo râu rồi chít chít...'],
    },
  },
};
