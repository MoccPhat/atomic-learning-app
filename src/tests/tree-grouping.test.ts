import { describe, it, expect } from 'vitest';
import {
  getFileExtension,
  getExtensionMeta,
  groupFilesByExtension,
  StoredFile,
  TreeData
} from '../lib/tree-types';

describe('Tree Storage - Extension Clustering & Metadata', () => {
  it('getFileExtension chuẩn hóa đúng đuôi file', () => {
    expect(getFileExtension('bai_tap_tuan_1.docx')).toBe('docx');
    expect(getFileExtension('notebook.ipynb')).toBe('ipynb');
    expect(getFileExtension('Slide_Bai_Giang.PDF')).toBe('pdf');
    expect(getFileExtension('script.test.py')).toBe('py');
    expect(getFileExtension('no_extension_file')).toBe('unknown');
  });

  it('getExtensionMeta trả về đúng label và icon type', () => {
    const docxMeta = getExtensionMeta('docx');
    expect(docxMeta.iconType).toBe('word');
    expect(docxMeta.label).toContain('.docx');

    const ipynbMeta = getExtensionMeta('ipynb');
    expect(ipynbMeta.iconType).toBe('notebook');
    expect(ipynbMeta.label).toContain('.ipynb');

    const pyMeta = getExtensionMeta('py');
    expect(pyMeta.iconType).toBe('code');

    const pdfMeta = getExtensionMeta('pdf');
    expect(pdfMeta.iconType).toBe('pdf');
  });

  it('groupFilesByExtension gom các file theo đúng từng folder đuôi file riêng biệt', () => {
    const files: StoredFile[] = [
      {
        id: '1',
        name: 'Report.docx',
        extension: 'docx',
        size: 1000,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        createdAt: '2026-10-11T00:00:00Z',
        data: 'data:,'
      },
      {
        id: '2',
        name: 'Lab.ipynb',
        extension: 'ipynb',
        size: 2000,
        mimeType: 'application/x-ipynb+json',
        createdAt: '2026-10-11T00:00:00Z',
        data: 'data:,'
      },
      {
        id: '3',
        name: 'Assignment.docx',
        extension: 'docx',
        size: 1500,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        createdAt: '2026-10-11T00:00:00Z',
        data: 'data:,'
      },
      {
        id: '4',
        name: 'cv_algorithm.py',
        extension: 'py',
        size: 500,
        mimeType: 'text/x-python',
        createdAt: '2026-10-11T00:00:00Z',
        data: 'data:,'
      }
    ];

    const groups = groupFilesByExtension(files);

    // Có 3 nhóm: docx, ipynb, py
    expect(groups.length).toBe(3);

    const docxGroup = groups.find((g) => g.extension === 'docx');
    expect(docxGroup).toBeDefined();
    expect(docxGroup!.files.length).toBe(2);
    expect(docxGroup!.files.map((f) => f.name)).toEqual(['Report.docx', 'Assignment.docx']);

    const ipynbGroup = groups.find((g) => g.extension === 'ipynb');
    expect(ipynbGroup).toBeDefined();
    expect(ipynbGroup!.files.length).toBe(1);
    expect(ipynbGroup!.files[0].name).toBe('Lab.ipynb');

    const pyGroup = groups.find((g) => g.extension === 'py');
    expect(pyGroup).toBeDefined();
    expect(pyGroup!.files.length).toBe(1);
    expect(pyGroup!.files[0].name).toBe('cv_algorithm.py');
  });

  it('createNewStoredFile tạo tệp với đuôi tùy chọn và khởi tạo đúng cấu trúc', async () => {
    const { createNewStoredFile } = await import('../lib/tree-storage');

    // 1. Tạo file .docx
    const docxFile = createNewStoredFile('Bao_Cao', 'docx');
    expect(docxFile.name).toBe('Bao_Cao.docx');
    expect(docxFile.extension).toBe('docx');
    expect(docxFile.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // 2. Tạo file .ipynb (Jupyter Notebook)
    const ipynbFile = createNewStoredFile('Lab_TensorFlow', 'ipynb');
    expect(ipynbFile.name).toBe('Lab_TensorFlow.ipynb');
    expect(ipynbFile.extension).toBe('ipynb');
    expect(ipynbFile.mimeType).toBe('application/x-ipynb+json');
    // Kiểm tra cấu trúc json
    const jsonStr = decodeURIComponent(ipynbFile.data.replace('data:application/json;charset=utf-8,', ''));
    const parsed = JSON.parse(jsonStr);
    expect(parsed.cells).toBeDefined();
    expect(parsed.cells.length).toBeGreaterThan(0);

    // 3. Tạo file .py không bị lặp đuôi (ví dụ: test.py -> test.py)
    const pyFile = createNewStoredFile('test_algo.py', 'py');
    expect(pyFile.name).toBe('test_algo.py');
    expect(pyFile.extension).toBe('py');

    // 4. Tạo file tùy chỉnh có dấu chấm ở đầu (ví dụ: .cpp)
    const cppFile = createNewStoredFile('main', '.cpp', '#include <iostream>');
    expect(cppFile.name).toBe('main.cpp');
    expect(cppFile.extension).toBe('cpp');
  });

  it('xóa 1 ngành học (deleteGroup) loại bỏ đúng ngành học đó', async () => {
    const { deleteGroup, countFilesInGroup } = await import('../lib/tree-storage');

    const sampleTree: TreeData = {
      groups: [
        {
          id: 'grp-cntt',
          name: 'Công Nghệ Thông Tin',
          subjects: [
            {
              id: 'sub-python',
              name: 'Lập trình Python',
              weeks: [
                {
                  id: 'wk-1',
                  weekNumber: 1,
                  title: 'Tuần 1',
                  files: [
                    {
                      id: 'f-1',
                      name: 'demo.py',
                      extension: 'py',
                      size: 100,
                      mimeType: 'text/x-python',
                      createdAt: '2026-10-12',
                      data: 'data:,'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'grp-nn',
          name: 'Ngoại Ngữ & Kỹ Năng',
          subjects: []
        },
        {
          id: 'grp-kinhte',
          name: 'Quản Trị Kinh Doanh',
          subjects: []
        }
      ]
    };

    expect(countFilesInGroup(sampleTree.groups[0])).toBe(1);
    expect(countFilesInGroup(sampleTree.groups[1])).toBe(0);

    // Xóa ngành học thứ 2
    const updated = await deleteGroup(sampleTree, 'grp-nn');
    expect(updated.groups.length).toBe(2);
    expect(updated.groups.map((g) => g.id)).toEqual(['grp-cntt', 'grp-kinhte']);
  });

  it('xóa nhiều ngành học (deleteGroups) loại bỏ đúng các ngành đã chọn', async () => {
    const { deleteGroups } = await import('../lib/tree-storage');

    const sampleTree: TreeData = {
      groups: [
        { id: 'g1', name: 'Ngành 1', subjects: [] },
        { id: 'g2', name: 'Ngành 2', subjects: [] },
        { id: 'g3', name: 'Ngành 3', subjects: [] },
        { id: 'g4', name: 'Ngành 4', subjects: [] }
      ]
    };

    // Xóa đồng thời g1 và g3
    const updated = await deleteGroups(sampleTree, ['g1', 'g3']);
    expect(updated.groups.length).toBe(2);
    expect(updated.groups.map((g) => g.id)).toEqual(['g2', 'g4']);
  });

  it('xóa tất cả các ngành học (deleteAllGroups) dọn sạch danh sách nhóm', async () => {
    const { deleteAllGroups } = await import('../lib/tree-storage');

    const updated = await deleteAllGroups();
    expect(updated.groups).toEqual([]);
    expect(updated.groups.length).toBe(0);
  });
});
