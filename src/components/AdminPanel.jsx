import React, { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Button, Space, Typography, Row, Col, Divider, Tooltip, Popconfirm } from 'antd';
import { SettingOutlined, LockOutlined, UnlockOutlined, SyncOutlined, ExperimentOutlined, ClearOutlined, DownloadOutlined, ImportOutlined, ExportOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function AdminPanel({
  sheetUrl,
  onSaveSheetUrl,
  onSyncWithSheet,
  onSimulateResults,
  onResetResults,
  onImportPlayer,
  onExportAllData,
  onLockAllStageMatches,
  currentStage,
  penaltiesConfig,
  onUpdatePenaltiesConfig
}) {
  const [urlForm] = Form.useForm();
  const [importForm] = Form.useForm();
  const [penaltiesForm] = Form.useForm();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (penaltiesConfig) {
      penaltiesForm.setFieldsValue(penaltiesConfig);
    }
  }, [penaltiesConfig, penaltiesForm]);

  const handleSaveUrl = (values) => {
    onSaveSheetUrl(values.sheetUrl.trim());
    alert('Đã lưu cấu hình Google Sheets URL!');
  };

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      await onSyncWithSheet();
      alert('Đồng bộ dữ liệu thành công!');
    } catch (e) {
      alert('Lỗi kết nối: Vui lòng kiểm tra lại URL Apps Script!');
    }
    setIsSyncing(false);
  };

  const handleImportSubmit = (values) => {
    try {
      const data = JSON.parse(values.importJson);
      if (!data.id || !data.predictions) {
        alert('Định dạng JSON không đúng! Cần có "id" và "predictions".');
        return;
      }
      onImportPlayer(data);
      alert(`Đã nạp dự đoán thành công cho user: ${data.id}`);
      importForm.resetFields();
    } catch (err) {
      alert('Lỗi cú pháp JSON! Vui lòng kiểm tra lại.');
    }
  };

  const handleExportClick = () => {
    const dataStr = onExportAllData();
    navigator.clipboard.writeText(dataStr);
    alert('Đã copy toàn bộ dữ liệu dự án vào Clipboard!');
  };

  return (
    <Card
      style={{
        background: 'rgba(15, 23, 42, 0.2)',
        border: '1px solid rgba(212, 177, 6, 0.25)',
        borderRadius: 16,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
      }}
      styles={{ body: { padding: 18 } }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Space>
          <SettingOutlined style={{ color: '#d4b106', fontSize: 18 }} className="animate-spin-slow" />
          <Title level={4} style={{ color: '#d4b106', margin: 0, fontSize: 15, letterSpacing: 1 }}>
            QUẢN TRỊ VIÊN (ADMIN)
          </Title>
        </Space>
        
        <Button
          size="small"
          type="default"
          onClick={() => setShowInstructions(!showInstructions)}
          icon={<QuestionCircleOutlined />}
          style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Hướng dẫn Sheets
        </Button>
      </div>

      {/* Sheet instructions */}
      {showInstructions && (
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 11 }}>
          <Text strong style={{ color: '#38bdf8', display: 'block', marginBottom: 6 }}>
            📝 HƯỚNG DẪN THIẾT LẬP GOOGLE SHEET BACKEND:
          </Text>
          <ol style={{ paddingLeft: 14, margin: 0, display: 'flex', flexDirection: 'column', gap: 4, color: '#cbd5e1' }}>
            <li>Tạo file Google Sheets mới.</li>
            <li>Vào <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.</li>
            <li>Copy đoạn mã trong file <code>google_sheets_setup.md</code> và dán thay thế mã cũ.</li>
            <li>Nhấn <strong>Save</strong> &gt; <strong>Deploy</strong> &gt; <strong>New Deployment</strong>.</li>
            <li>Chọn cấu hình <strong>Web app</strong>. Chọn Execute as <strong>Me</strong> và Who has access <strong>Anyone</strong>.</li>
            <li>Deploy và copy <strong>Web App URL</strong> dán vào ô bên dưới.</li>
          </ol>
        </div>
      )}

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        
        {/* Google Sheets API */}
        <div style={{ background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
          <Text strong style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
            1. KẾT NỐI GOOGLE SHEETS API
          </Text>
          <Form
            form={urlForm}
            layout="vertical"
            initialValues={{ sheetUrl }}
            onFinish={handleSaveUrl}
          >
            <Form.Item name="sheetUrl" style={{ marginBottom: 8 }}>
              <Input
                placeholder="https://script.google.com/macros/s/.../exec"
                style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }}
              />
            </Form.Item>
            <div className="flex gap-2">
              <Button type="primary" htmlType="submit" style={{ flex: 1, fontSize: 11, background: '#d4b106', borderColor: '#d4b106', color: '#000', fontWeight: 'bold' }}>
                Lưu cấu hình
              </Button>
              {sheetUrl && (
                <Button
                  onClick={handleSyncClick}
                  loading={isSyncing}
                  icon={<SyncOutlined />}
                  style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Đồng bộ
                </Button>
              )}
            </div>
          </Form>
        </div>

        {/* Lock stage & Simulation */}
        <div style={{ background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
          <Text strong style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
            2. ĐIỀU KHIỂN & KHÓA VÒNG ĐẤU ({currentStage.toUpperCase()})
          </Text>
          <Row gutter={8} style={{ marginBottom: 12 }}>
            <Col span={12}>
              <Button
                danger
                onClick={() => onLockAllStageMatches(currentStage, true)}
                icon={<LockOutlined />}
                style={{ width: '100%', fontSize: 11, fontWeight: 'bold', height: 32 }}
              >
                Khóa vòng này
              </Button>
            </Col>
            <Col span={12}>
              <Button
                type="dashed"
                onClick={() => onLockAllStageMatches(currentStage, false)}
                icon={<UnlockOutlined />}
                style={{ width: '100%', fontSize: 11, fontWeight: 'bold', height: 32, borderColor: '#52c41a', color: '#52c41a' }}
              >
                Mở khóa vòng này
              </Button>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0', borderTop: '1px dashed rgba(255,255,255,0.05)' }} />
          
          <Text strong style={{ fontSize: 10, color: '#d4b106', display: 'block', marginBottom: 6 }}>
            QUẢN LÝ DỰ ĐOÁN VÔ ĐỊCH:
          </Text>
          <Row gutter={8} style={{ marginBottom: 12 }}>
            <Col span={12}>
              <Button
                danger
                onClick={() => onLockAllStageMatches('CONFIG_LOCK_CHAMPION', true)}
                icon={<LockOutlined />}
                style={{ width: '100%', fontSize: 11, fontWeight: 'bold', height: 32 }}
              >
                Khóa cược Vô Địch
              </Button>
            </Col>
            <Col span={12}>
              <Button
                type="dashed"
                onClick={() => onLockAllStageMatches('CONFIG_LOCK_CHAMPION', false)}
                icon={<UnlockOutlined />}
                style={{ width: '100%', fontSize: 11, fontWeight: 'bold', height: 32, borderColor: '#52c41a', color: '#52c41a' }}
              >
                Mở khóa cược Vô Địch
              </Button>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }} />

          <Text strong style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 6 }}>
            GIẢ LẬP ĐIỂM SỐ NHANH:
          </Text>
          <Row gutter={8}>
            <Col span={12}>
              <Popconfirm
                title="Giả lập kết quả?"
                description="Hành động này sẽ điền ngẫu nhiên kết quả các trận đấu và tính lại điểm số."
                onConfirm={onSimulateResults}
                okText="Đồng ý"
                cancelText="Hủy"
              >
                <Button type="primary" danger icon={<ExperimentOutlined />} style={{ width: '100%', fontSize: 11, height: 32, background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', borderColor: '#d97706' }}>
                  Giả lập kết quả
                </Button>
              </Popconfirm>
            </Col>
            <Col span={12}>
              <Popconfirm
                title="Xóa toàn bộ kết quả?"
                description="Reset tất cả trận đấu về chưa diễn ra."
                onConfirm={onResetResults}
                okText="Xóa sạch"
                cancelText="Hủy"
              >
                <Button icon={<ClearOutlined />} style={{ width: '100%', fontSize: 11, height: 32, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#ff4d4f' }}>
                  Xóa kết quả
                </Button>
              </Popconfirm>
            </Col>
          </Row>
        </div>

        {/* Config Penalties */}
        <div style={{ background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
          <Text strong style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
            3. CẤU HÌNH ĐIỂM PHẠT THEO VÒNG
          </Text>
          <Form
            form={penaltiesForm}
            layout="vertical"
            initialValues={penaltiesConfig}
            onFinish={(values) => {
              onUpdatePenaltiesConfig(values);
              alert('Đã cập nhật cấu hình điểm phạt thành công!');
            }}
          >
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item 
                  label={<span style={{ fontSize: 10, color: '#94a3b8' }}>Vòng Bảng</span>} 
                  name="group" 
                  style={{ marginBottom: 6 }}
                  rules={[{ required: true, message: 'Nhập điểm!' }]}
                >
                  <InputNumber min={0} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label={<span style={{ fontSize: 10, color: '#94a3b8' }}>Vòng 32 Đội</span>} 
                  name="r32" 
                  style={{ marginBottom: 6 }}
                  rules={[{ required: true, message: 'Nhập điểm!' }]}
                >
                  <InputNumber min={0} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }} />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item 
                  label={<span style={{ fontSize: 10, color: '#94a3b8' }}>Vòng 16 Đội</span>} 
                  name="r16" 
                  style={{ marginBottom: 6 }}
                  rules={[{ required: true, message: 'Nhập điểm!' }]}
                >
                  <InputNumber min={0} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label={<span style={{ fontSize: 10, color: '#94a3b8' }}>Tứ Kết</span>} 
                  name="qf" 
                  style={{ marginBottom: 6 }}
                  rules={[{ required: true, message: 'Nhập điểm!' }]}
                >
                  <InputNumber min={0} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={8}>
              <Col span={12}>
                <Form.Item 
                  label={<span style={{ fontSize: 10, color: '#94a3b8' }}>Bán Kết</span>} 
                  name="sf" 
                  style={{ marginBottom: 6 }}
                  rules={[{ required: true, message: 'Nhập điểm!' }]}
                >
                  <InputNumber min={0} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label={<span style={{ fontSize: 10, color: '#94a3b8' }}>Tranh Hạng 3</span>} 
                  name="third_place" 
                  style={{ marginBottom: 6 }}
                  rules={[{ required: true, message: 'Nhập điểm!' }]}
                >
                  <InputNumber min={0} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={8} style={{ marginBottom: 8 }}>
              <Col span={12}>
                <Form.Item 
                  label={<span style={{ fontSize: 10, color: '#94a3b8' }}>Chung Kết</span>} 
                  name="final" 
                  style={{ marginBottom: 6 }}
                  rules={[{ required: true, message: 'Nhập điểm!' }]}
                >
                  <InputNumber min={0} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }} />
                </Form.Item>
              </Col>
            </Row>

            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ width: '100%', fontSize: 11, background: '#d4b106', borderColor: '#d4b106', color: '#000', fontWeight: 'bold', marginTop: 4 }}
            >
              Lưu cấu hình điểm phạt
            </Button>
          </Form>
        </div>

        {/* Import JSON */}
        <div style={{ background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
          <Text strong style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
            4. NHẬP DỰ ĐOÁN NGƯỜI CHƠI (JSON)
          </Text>
          <Form form={importForm} onFinish={handleImportSubmit}>
            <Form.Item name="importJson" style={{ marginBottom: 8 }}>
              <TextArea
                rows={2}
                placeholder='Dán JSON dạng {"id":"USER_NAME", "predictions":{"g1":"A"}}...'
                style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontFamily: 'monospace' }}
              />
            </Form.Item>
            <Button htmlType="submit" icon={<ImportOutlined />} style={{ width: '100%', fontSize: 11, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
              Nạp dự đoán người chơi
            </Button>
          </Form>
        </div>

        {/* Export Data */}
        <div style={{ background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
          <Text strong style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>
            5. BACKUP DỮ LIỆU DỰ ÁN
          </Text>
          <Paragraph style={{ fontSize: 10, color: '#64748b', margin: '0 0 10px 0' }}>
            Xuất toàn bộ cơ sở dữ liệu hiện tại (gồm người chơi, dự đoán và kết quả thực tế) để lưu trữ dự phòng.
          </Paragraph>
          <Button onClick={handleExportClick} icon={<ExportOutlined />} style={{ width: '100%', fontSize: 11, background: 'rgba(255,255,255,0.05)', color: '#d4b106', border: '1px solid rgba(212, 177, 6, 0.25)' }}>
            Sao lưu dữ liệu (Copy JSON)
          </Button>
        </div>

      </Space>
    </Card>
  );
}
