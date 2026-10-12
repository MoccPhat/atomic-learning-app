import { describe, it, expect } from 'vitest';
import { generateSubjectDigest } from '../lib/study-digest-service';
import { Subject } from '../lib/tree-types';
import { CornellNote } from '../lib/cornell-types';
import { Card } from '../lib/types';

describe('Subject Study Digest Service', () => {
  const mockSubject: Subject = {
    id: 'sub_cv',
    name: 'Thị giác máy tính & Xử lý ảnh',
    code: 'CS402',
    description: 'Nghiên cứu thị giác máy tính và học sâu',
    weeks: [
      {
        id: 'w1',
        weekNumber: 1,
        title: 'Tuần 1: Nhập môn & Không gian màu RGB, HSV',
        files: [
          {
            id: 'f1',
            name: 'demo_tach_mau_hsv.py',
            extension: 'py',
            size: 1024,
            mimeType: 'text/x-python',
            createdAt: '2026-10-12T00:00:00Z',
            data: 'import cv2\nimport numpy as np',
            highlights: [
              {
                id: 'hl1',
                text: 'Không gian màu HSV phân tách thông tin màu sắc (Hue) và độ sáng (Value)',
                color: 'yellow',
                createdAt: '2026-10-12T00:00:00Z',
                note: 'Khái niệm quan trọng thi giữa kỳ'
              }
            ]
          }
        ]
      }
    ]
  };

  const mockCornellNotes: CornellNote[] = [
    {
      id: 'cn1',
      title: 'Thuật toán Canny Edge Detection',
      category: 'code',
      subjectGroup: 'Thị giác máy tính & Xử lý ảnh',
      weekNumber: 1,
      cues: [
        {
          id: 'cue1',
          cue: '4 bước cốt lõi của thuật toán Canny là gì?',
          referenceAnswer: 'Gaussian filter -> Gradient calculation -> Non-maximum suppression -> Hysteresis thresholding'
        }
      ],
      notes: 'Thuật toán Canny là tiêu chuẩn vàng trong phát hiện biên cạnh.',
      summary: 'Canny giúp tìm biên cạnh tối ưu, giảm nhiễu tốt.',
      tags: ['#opencv', '#canny'],
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z'
    }
  ];

  const mockCards: Card[] = [
    {
      id: 'c1',
      category: 'code',
      title: 'Không gian màu HSV',
      front: 'Hue trong HSV đại diện cho điều gì?',
      back: 'Sắc thái màu (0 - 360 độ hoặc 0 - 180 trong OpenCV)',
      tags: ['CS402', 'thị giác máy tính'],
      interval: 1,
      repetitions: 1,
      easeFactor: 2.5,
      dueDate: '2026-10-13',
      createdAt: '2026-10-12T00:00:00Z'
    }
  ];

  it('tạo cẩm nang môn học với đầy đủ các phần: tổng quan, cornell, trích dẫn, flashcard', () => {
    const result = generateSubjectDigest(mockSubject, mockCornellNotes, mockCards, {
      authorName: 'Kai',
      includeOverview: true,
      includeCornellNotes: true,
      includeHighlights: true,
      includeFlashcards: true,
      includeFileList: true
    });

    expect(result.fileName).toContain('Cam_Nang');
    expect(result.markdown).toContain('CẨM NANG ÔN TẬP MÔN HỌC: THỊ GIÁC MÁY TÍNH & XỬ LÝ ẢNH');
    expect(result.markdown).toContain('CS402');
    expect(result.markdown).toContain('Biên soạn bởi: Kai');
    expect(result.markdown).toContain('Thuật toán Canny Edge Detection');
    expect(result.markdown).toContain('4 bước cốt lõi của thuật toán Canny là gì?');
    expect(result.markdown).toContain('Không gian màu HSV phân tách thông tin màu sắc');
    expect(result.markdown).toContain('Khái niệm quan trọng thi giữa kỳ');
    expect(result.markdown).toContain('Hue trong HSV đại diện cho điều gì?');
    expect(result.totalWeeks).toBe(1);
    expect(result.totalNotes).toBe(1);
    expect(result.totalHighlights).toBe(1);
    expect(result.totalCards).toBe(1);
  });

  it('cho phép tùy biến ẩn/hiện từng thành phần theo options', () => {
    const result = generateSubjectDigest(mockSubject, mockCornellNotes, mockCards, {
      includeCornellNotes: false,
      includeHighlights: false
    });

    expect(result.markdown).not.toContain('BỘ GHI CHÚ CHUẨN CORNELL');
    expect(result.markdown).not.toContain('TUYỂN TẬP TRÍCH DẪN');
    expect(result.markdown).toContain('DANH MỤC TÀI LIỆU & TỆP TIN THAM KHẢO');
  });

  it('xử lý an toàn khi môn học chưa có file hay ghi chú nào', () => {
    const emptySubject: Subject = {
      id: 'sub_empty',
      name: 'Toán Rời Rạc',
      weeks: []
    };

    const result = generateSubjectDigest(emptySubject, [], []);
    expect(result.totalWeeks).toBe(0);
    expect(result.totalNotes).toBe(0);
    expect(result.totalHighlights).toBe(0);
    expect(result.totalCards).toBe(0);
    expect(result.markdown.toLowerCase()).toContain('toán rời rạc');
  });
});
