import React from 'react';
import { Modal, Form, Input, Button, Space, Typography } from 'antd';
import { CrownOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function LoginModal({
  open,
  onLoginSubmit,
  onViewAsGuest
}) {
  return (
    <Modal
      title={
        <div className="text-center pt-2">
          <CrownOutlined style={{ color: '#ffd700', fontSize: 24 }} />
          <Title level={4} style={{ color: '#ffd700', margin: '8px 0 0 0', textTransform: 'uppercase', fontSize: 16 }}>
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
        <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', display: 'block' }}>
          Vui lòng nhập Mã người chơi riêng biệt. Ví dụ thienhd
        </Text>

        <Form onFinish={onLoginSubmit}>
          <Form.Item
            name="ma_user"
            rules={[{ required: true, message: 'Vui lòng nhập Mã người chơi!' }]}
            style={{ marginBottom: 14 }}
          >
            <Input
              placeholder="Ví dụ: ANH_TUAN, USER01..."
              prefix={<UserOutlined style={{ color: '#ffd700' }} />}
              style={{ height: 40, fontSize: 13, background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
              autoFocus
            />
          </Form.Item>
          
          <Space style={{ width: '100%' }} direction="vertical" size={8}>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: '100%', height: 38, fontWeight: 'bold', background: 'linear-gradient(135deg, #ffd700 0%, #d97706 100%)', borderColor: '#ffd700', color: '#000' }}
            >
              Xác nhận
            </Button>
            
            <Button
              type="text"
              onClick={onViewAsGuest}
              icon={<EyeOutlined />}
              style={{ width: '100%', color: '#64748b', fontSize: 11 }}
            >
              Xem với tư cách Khách (Chỉ xem lịch & điểm)
            </Button>
          </Space>
        </Form>
      </Space>
    </Modal>
  );
}
