import React, { useState } from 'react';
import { Modal, Form, Input, Button, Space, Typography, Alert, Spin } from 'antd';
import { CrownOutlined, UserOutlined, LockOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * LoginModal — Nhập mã định danh + mật khẩu.
 *
 * Props:
 *  - open          : boolean
 *  - onLoginSubmit : async (values: { ma_user, password }) => { success, isFirstTime, error }
 *  - onViewAsGuest : () => void
 */
export default function LoginModal({ open, onLoginSubmit, onViewAsGuest }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFinish = async (values) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const result = await onLoginSubmit(values);
      if (result && !result.success) {
        setErrorMsg(result.error || 'Mật khẩu không đúng. Vui lòng thử lại!');
        form.resetFields(['password']);
      } else {
        form.resetFields();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestClick = () => {
    setErrorMsg('');
    form.resetFields();
    onViewAsGuest();
  };

  return (
    <Modal
      title={
        <div className="text-center pt-2">
          <CrownOutlined style={{ color: '#ffd700', fontSize: 24 }} />
          <Title
            level={4}
            style={{
              color: '#ffd700',
              margin: '8px 0 0 0',
              textTransform: 'uppercase',
              fontSize: 16,
            }}
          >
            Nhập mã định danh để dự đoán
          </Title>
        </div>
      }
      open={open}
      closable={false}
      footer={null}
      maskClosable={false}
      centered
      width={380}
      styles={{ body: { padding: '10px 24px 20px 24px' } }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 10 }}>
        <Text
          style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', display: 'block' }}
        >
          Nhập Mã người chơi và Mật khẩu của bạn.
          <br />
          <span style={{ color: '#64748b', fontSize: 11 }}>
            (Lần đầu: mật khẩu nhập vào sẽ được lưu tự động)
          </span>
        </Text>

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            style={{ borderRadius: 8, fontSize: 12 }}
          />
        )}

        <Form form={form} onFinish={handleFinish} layout="vertical">
          {/* MÃ NGƯỜI CHƠI */}
          <Form.Item
            name="ma_user"
            rules={[{ required: true, message: 'Vui lòng nhập Mã người chơi!' }]}
            style={{ marginBottom: 14 }}
          >
            <Input
              placeholder="Ví dụ: ANH_TUAN, USER01..."
              prefix={<UserOutlined style={{ color: '#ffd700' }} />}
              style={{
                height: 40,
                fontSize: 13,
                background: 'rgba(0,0,0,0.4)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
              autoFocus
              autoComplete="username"
            />
          </Form.Item>

          {/* MẬT KHẨU */}
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập Mật khẩu!' },
              { min: 3, message: 'Mật khẩu tối thiểu 3 ký tự!' },
            ]}
            style={{ marginBottom: 20 }}
          >
            <Input.Password
              placeholder="Mật khẩu (tối thiểu 3 ký tự)"
              prefix={<LockOutlined style={{ color: '#ffd700' }} />}
              style={{
                height: 40,
                fontSize: 13,
                background: 'rgba(0,0,0,0.4)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
              autoComplete="current-password"
            />
          </Form.Item>

          <Space style={{ width: '100%' }} direction="vertical" size={8}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: 38,
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #ffd700 0%, #d97706 100%)',
                borderColor: '#ffd700',
                color: '#000',
              }}
            >
              {loading ? 'Đang kiểm tra...' : 'Xác nhận'}
            </Button>

            <Button
              type="text"
              onClick={handleGuestClick}
              icon={<EyeOutlined />}
              disabled={loading}
              style={{ width: '100%', color: '#64748b', fontSize: 11 }}
            >
              Xem với tư cách Khách (Chỉ xem lịch &amp; điểm)
            </Button>
          </Space>
        </Form>
      </Space>
    </Modal>
  );
}
