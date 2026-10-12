import { TreeData } from './tree-types';

// Mẫu Jupyter notebook tối giản để render xem trước
const SAMPLE_IPYNB_CONTENT = JSON.stringify(
  {
    cells: [
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '# Bài thực hành Tuần 1: Nhập môn Xử lý ảnh với OpenCV\n',
          '**Môn học:** Thị giác máy tính & Xử lý ảnh\n',
          '## 1. Đọc và hiển thị ảnh'
        ]
      },
      {
        cell_type: 'code',
        execution_count: 1,
        metadata: {},
        outputs: [
          {
            name: 'stdout',
            output_type: 'stream',
            text: ['Kích thước ảnh: (480, 640, 3)\n', 'Chuyển đổi sang HSV thành công!\n']
          }
        ],
        source: [
          'import cv2\n',
          'import numpy as np\n',
          '\n',
          '# Đọc ảnh mẫu\n',
          'img = cv2.imread("sample.jpg")\n',
          'hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)\n',
          'print("Kích thước ảnh:", img.shape)\n',
          'print("Chuyển đổi sang HSV thành công!")'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 2. Lọc màu theo ngưỡng HSV\n',
          'Xác định dải màu đỏ để phân đoạn quả táo trong ảnh.'
        ]
      },
      {
        cell_type: 'code',
        execution_count: 2,
        metadata: {},
        outputs: [],
        source: [
          'lower_red = np.array([0, 120, 70])\n',
          'upper_red = np.array([10, 255, 255])\n',
          'mask = cv2.inRange(hsv, lower_red, upper_red)\n',
          '# Lưu kết quả\n',
          'print("Đã tạo mask phân đoạn!")'
        ]
      }
    ],
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3'
      }
    },
    nbformat: 4,
    nbformat_minor: 2
  },
  null,
  2
);

const SAMPLE_PYTHON_CODE = `import cv2
import numpy as np

def detect_edges(image_path):
    """Phát hiện biên cạnh bằng thuật toán Canny"""
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    blurred = cv2.GaussianBlur(img, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    return edges

if __name__ == '__main__':
    print("Demo lọc biên cạnh Sobel / Canny sẵn sàng!")
`;

export const INITIAL_TREE_DATA: TreeData = {
  groups: [
    {
      id: 'grp-cntt',
      name: 'Chuyên ngành Công Nghệ Thông Tin',
      subjects: [
        {
          id: 'sub-cv',
          name: 'Thị giác máy tính & Xử lý ảnh',
          code: 'CS402',
          description: 'OpenCV, Trích xuất đặc trưng, Nhận diện đối tượng, YOLO và Phân loại',
          weeks: [
            {
              id: 'wk-cv-1',
              weekNumber: 1,
              title: 'Tuần 1: Nhập môn & Không gian màu RGB, HSV, Grayscale',
              files: [
                {
                  id: 'f-cv-1-ipynb',
                  name: 'lab01_nhap_mon_opencv.ipynb',
                  extension: 'ipynb',
                  size: 4096,
                  mimeType: 'application/x-ipynb+json',
                  createdAt: new Date().toISOString(),
                  data: 'data:application/json;charset=utf-8,' + encodeURIComponent(SAMPLE_IPYNB_CONTENT),
                  note: 'Bài thực hành đọc ảnh và chuyển đổi màu RGB sang HSV'
                },
                {
                  id: 'f-cv-1-docx',
                  name: 'Bao_Cao_Bai_Tap_Tuan_1.docx',
                  extension: 'docx',
                  size: 24576,
                  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  createdAt: new Date().toISOString(),
                  data: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQABgAIAAAAIQA=',
                  note: 'Mẫu báo cáo nộp bài tập tuần 1'
                },
                {
                  id: 'f-cv-1-py',
                  name: 'demo_tach_mau_hsv.py',
                  extension: 'py',
                  size: 1024,
                  mimeType: 'text/x-python',
                  createdAt: new Date().toISOString(),
                  data: 'data:text/plain;charset=utf-8,' + encodeURIComponent(SAMPLE_PYTHON_CODE),
                  note: 'Script Python demo tách ngưỡng màu'
                },
                {
                  id: 'f-cv-1-pdf',
                  name: 'Slide_Bai_Giang_Tuan_1.pdf',
                  extension: 'pdf',
                  size: 184320,
                  mimeType: 'application/pdf',
                  createdAt: new Date().toISOString(),
                  data: 'data:application/pdf;base64,JVBERi0xLjQKJ',
                  note: 'Slide bài giảng lý thuyết giáo trình'
                }
              ]
            },
            {
              id: 'wk-cv-2',
              weekNumber: 2,
              title: 'Tuần 2: Lọc tích chập & Phát hiện biên cạnh (Sobel, Canny)',
              files: [
                {
                  id: 'f-cv-2-ipynb',
                  name: 'lab02_canny_edge_detection.ipynb',
                  extension: 'ipynb',
                  size: 5120,
                  mimeType: 'application/x-ipynb+json',
                  createdAt: new Date().toISOString(),
                  data: 'data:application/json;charset=utf-8,' + encodeURIComponent(SAMPLE_IPYNB_CONTENT),
                  note: 'Notebook thực hành lọc ảnh Gaussian và Canny'
                },
                {
                  id: 'f-cv-2-docx',
                  name: 'De_Cuong_Thuc_Hanh_Tuan_2.docx',
                  extension: 'docx',
                  size: 31200,
                  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  createdAt: new Date().toISOString(),
                  data: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQABgAIAAAAIQA=',
                  note: 'Đề cương yêu cầu hoàn thành bài tập'
                }
              ]
            }
          ]
        },
        {
          id: 'sub-ml',
          name: 'Học máy & Trí tuệ nhân tạo (Machine Learning)',
          code: 'CS301',
          description: 'Hồi quy tuyến tính, Logistic Regression, Decision Trees, K-Means',
          weeks: [
            {
              id: 'wk-ml-1',
              weekNumber: 1,
              title: 'Tuần 1: Linear Regression & Gradient Descent',
              files: [
                {
                  id: 'f-ml-1-ipynb',
                  name: 'linear_regression_scratch.ipynb',
                  extension: 'ipynb',
                  size: 6144,
                  mimeType: 'application/x-ipynb+json',
                  createdAt: new Date().toISOString(),
                  data: 'data:application/json;charset=utf-8,' + encodeURIComponent(SAMPLE_IPYNB_CONTENT),
                  note: 'Cài đặt thuật toán hồi quy tuyến tính từ đầu'
                },
                {
                  id: 'f-ml-1-docx',
                  name: 'Ghi_Chu_Ly_Thuyet_Toan_ML.docx',
                  extension: 'docx',
                  size: 19800,
                  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  createdAt: new Date().toISOString(),
                  data: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQABgAIAAAAIQA=',
                  note: 'Đạo hàm và hàm mất mát MSE'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'grp-language',
      name: 'Ngoại Ngữ & Kỹ Năng',
      subjects: [
        {
          id: 'sub-en',
          name: 'Tiếng Anh Kỹ Thuật (Technical English)',
          code: 'ENG201',
          description: 'Từ vựng chuyên ngành máy tính, viết tài liệu kỹ thuật',
          weeks: [
            {
              id: 'wk-en-1',
              weekNumber: 1,
              title: 'Tuần 1: Computer Systems & Software Engineering Terms',
              files: [
                {
                  id: 'f-en-1-docx',
                  name: 'Vocabulary_List_Week_1.docx',
                  extension: 'docx',
                  size: 15400,
                  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  createdAt: new Date().toISOString(),
                  data: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQABgAIAAAAIQA=',
                  note: '50 từ vựng cốt lõi'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
