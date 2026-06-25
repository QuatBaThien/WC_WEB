import React from 'react';
import { Layout, Menu, Button, Space, Badge, Typography } from 'antd';
import { TrophyFilled, CloudServerOutlined, UserOutlined, LogoutOutlined, LockFilled } from '@ant-design/icons';

const { Header } = Layout;
const { Text, Title } = Typography;

export default function Navbar({
  currentUserId,
  onLogout,
  onOpenLoginModal,
  sheetConnected,
  isAdmin,
  onNavigate
}) {
  return (
    <Header
      style={{
        background: 'rgba(10, 11, 30, 0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        height: 'auto',
        lineHeight: 'normal',
        padding: '12px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Title logo */}
        <Space 
          size={12} 
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate && onNavigate('/')}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, #ffd700 0%, #d97706 100%)',
              width: 38,
              height: 38,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(253, 224, 71, 0.4)'
            }}
          >
            <TrophyFilled style={{ color: '#0f172a', fontSize: 18 }} />
          </div>
          <div>
            <Title level={4} style={{ color: '#fff', margin: 0, fontSize: 16, fontWeight: 900, letterSpacing: 1.5 }} className="wc-title">
              WC 2026 PREDICT
            </Title>
            <Text style={{ fontSize: 9, color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Dự Đoán Nhóm Bạn • World Cup 2026
            </Text>
          </div>
        </Space>

        {/* Info & Profile section */}
        <Space size={16} align="center">
          
          {/* Connection Status badge */}
          <Badge
            status={sheetConnected ? 'success' : 'warning'}
            text={
              <Space size={4}>
                <CloudServerOutlined style={{ color: sheetConnected ? '#52c41a' : '#faad14' }} />
                <span style={{ fontSize: 11, color: sheetConnected ? '#52c41a' : '#faad14', fontWeight: 600 }}>
                  {sheetConnected ? 'Google Sheets' : 'Local Storage'}
                </span>
              </Space>
            }
            style={{ marginRight: 8 }}
          />

          {/* User profile */}
          {currentUserId ? (
            <Space size={8}>
              <div 
                style={{
                  background: isAdmin ? 'rgba(212, 177, 6, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  border: isAdmin ? '1px solid #d4b106' : '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '5px 12px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isAdmin ? (
                  <LockFilled style={{ color: '#d4b106', fontSize: 12 }} />
                ) : (
                  <UserOutlined style={{ color: '#38bdf8', fontSize: 12 }} />
                )}
                <Text style={{ color: isAdmin ? '#d4b106' : '#e2e8f0', fontSize: 12, fontWeight: 'bold' }}>
                  {isAdmin ? 'ADMIN (admin_wc)' : currentUserId}
                </Text>
              </div>

              <Button
                type="text"
                danger
                onClick={onLogout}
                icon={<LogoutOutlined />}
                style={{ fontSize: 11, height: 32, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Thoát
              </Button>
            </Space>
          ) : (
            <Button
              type="primary"
              onClick={onOpenLoginModal}
              icon={<UserOutlined />}
              style={{
                fontSize: 12,
                fontWeight: 'bold',
                height: 32,
                background: 'linear-gradient(135deg, #00f5a0 0%, #00b894 100%)',
                borderColor: '#00f5a0',
                color: '#0f172a'
              }}
            >
              Nhập mã User
            </Button>
          )}

        </Space>

      </div>
    </Header>
  );
}
