import React from 'react';
import { Card, Select, Tag, Row, Col, Typography, Alert, Space } from 'antd';
import { TrophyFilled, LockOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { CHAMPION_OPTIONS } from '../data/wcData';

const { Text, Title, Paragraph } = Typography;

export default function ChampionPanel({
  predictions,
  onPredictChamp,
  isLocked,
  currentUserId,
  onOpenLoginModal
}) {
  const wagerOptions = [
    { value: 0, label: 'Không cược (0đ)' },
    { value: 10, label: 'Cược 10đ Phạt' },
    { value: 20, label: 'Cược 20đ Phạt' },
    { value: 30, label: 'Cược 30đ Phạt' },
    { value: 40, label: 'Cược 40đ Phạt' },
    { value: 50, label: 'Cược 50đ Phạt' }
  ];

  const handleWagerChange = (teamCode, val) => {
    if (!currentUserId) {
      onOpenLoginModal();
      return;
    }
    onPredictChamp(teamCode, val);
  };

  return (
    <Card
      style={{
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }}
      styles={{ body: { padding: 20 } }}
    >
      {/* Title & Info */}
      <div className="flex items-center gap-2 mb-4">
        <TrophyFilled style={{ color: '#ffd700', fontSize: 20 }} className="animate-bounce" />
        <Title level={4} style={{ color: '#fff', margin: 0, fontSize: 16, letterSpacing: 1 }}>
          DỰ ĐOÁN NHÀ VÔ ĐỊCH WORLD CUP 2026
        </Title>
      </div>

      <Alert
        message={
          <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#cbd5e1' }}>
            <span style={{ fontWeight: 'bold', color: '#ffd700' }}>💡 LUẬT CHƠI ĐẶT CƯỢC ĐIỂM PHẠT:</span>
            <ul style={{ paddingLeft: 14, margin: '4px 0 0 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <li>Bạn có thể cược cho nhiều đội bóng ứng cử viên (không giới hạn).</li>
              <li>Mỗi lựa chọn yêu cầu đặt cọc phạt: **10đ, 20đ, 30đ, 40đ hoặc 50đ**.</li>
              <li>Khi giải đấu diễn ra, số điểm cược sẽ tạm cộng vào điểm phạt của bạn.</li>
              <li>Nếu đội đó **VÔ ĐỊCH**, bạn sẽ được **GIẢM (Khấu trừ) điểm phạt = Điểm cược × Odds** của đội đó.</li>
              <li>Nếu đội đó trượt ngôi vương, số điểm cược phạt ban đầu sẽ giữ nguyên trên điểm số của bạn.</li>
            </ul>
          </div>
        }
        type="warning"
        showIcon
        icon={<InfoCircleOutlined style={{ color: '#ffd700' }} />}
        style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.25)', marginBottom: 20, borderRadius: 10 }}
      />

      {isLocked && (
        <div style={{ marginBottom: 16 }}>
          <Tag color="red" icon={<LockOutlined />} style={{ fontWeight: 'bold', padding: '4px 12px', fontSize: 11, borderRadius: 6 }}>
            HẾT HẠN DỰ ĐOÁN VÔ ĐỊCH (Đã khóa)
          </Tag>
        </div>
      )}

      {/* Grid of Candidates */}
      <Row gutter={[16, 16]}>
        {CHAMPION_OPTIONS.map(opt => {
          const currentWager = predictions[`CHAMP_${opt.code}`] ? Number(predictions[`CHAMP_${opt.code}`]) : 0;
          const potentialDiscount = Math.round(currentWager * opt.odds);

          return (
            <Col xs={24} sm={12} key={opt.code}>
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: currentWager > 0 ? '1.5px solid #ffd700' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  boxShadow: currentWager > 0 ? '0 0 15px rgba(253, 224, 71, 0.1)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Flag & Team Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={`https://flagcdn.com/w80/${opt.code === 'ENG' ? 'gb' : opt.code === 'FRA' ? 'fr' : opt.code === 'ESP' ? 'es' : opt.code === 'ARG' ? 'ar' : opt.code === 'BRA' ? 'br' : opt.code === 'POR' ? 'pt' : opt.code === 'GER' ? 'de' : 'nl'}.png`}
                    alt={opt.name}
                    style={{ width: 44, height: 30, objectFit: 'cover', borderRadius: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                  />
                  <div>
                    <Text strong style={{ color: '#fff', fontSize: 13, display: 'block' }}>{opt.name}</Text>
                    <Tag color="gold" style={{ fontSize: 9, margin: '2px 0 0 0', fontWeight: 'bold' }}>Odds: x{opt.odds}</Tag>
                  </div>
                </div>

                {/* Selection & Payout projection */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Select
                    value={currentWager}
                    onChange={(val) => handleWagerChange(opt.code, val)}
                    disabled={isLocked}
                    options={wagerOptions}
                    size="small"
                    style={{ width: 140 }}
                  />
                  {currentWager > 0 && (
                    <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
                      <Text style={{ color: '#ff4d4f' }}>Phạt cọc: +{currentWager}đ</Text>
                      <br />
                      <Text style={{ color: '#00f5a0', fontWeight: 'bold' }}>Trúng giảm: -{potentialDiscount}đ</Text>
                    </div>
                  )}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}
