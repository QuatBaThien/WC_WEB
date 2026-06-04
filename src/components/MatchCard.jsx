import React from 'react';
import { Card, Button, Tag, Space, Typography, Row, Col, Input, Badge } from 'antd';
import { TEAMS } from '../data/wcData';
import { LockOutlined, UnlockOutlined, CheckCircleFilled, CloseCircleFilled, EnvironmentOutlined, CalendarOutlined, EditOutlined, RetweetOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function MatchCard({
  match,
  prediction,
  onPredict,
  isAdmin,
  onSetResult,
  isLocked,
  penaltiesConfig
}) {
  const teamAInfo = TEAMS[match.teamA];
  const teamBInfo = TEAMS[match.teamB];

  const teamAName = teamAInfo ? teamAInfo.name : match.teamAName;
  const teamBName = teamBInfo ? teamBInfo.name : match.teamBName;

  // Lấy ảnh cờ từ FlagCDN
  const getFlagUrl = (teamInfo, placeholderText) => {
    if (teamInfo && teamInfo.iso) {
      return `https://flagcdn.com/w80/${teamInfo.iso.toLowerCase()}.png`;
    }
    return null;
  };

  const flagA = getFlagUrl(teamAInfo);
  const flagB = getFlagUrl(teamBInfo);

  const actualResult = match.result; // 'A' | 'D' | 'B'

  const penaltyVal = (penaltiesConfig && penaltiesConfig[match.stage] !== undefined)
    ? Number(penaltiesConfig[match.stage])
    : 10;

  let isCorrect = false;
  let pointsPenalty = 0;
  if (actualResult) {
    if (prediction === actualResult) {
      isCorrect = true;
      pointsPenalty = 0;
    } else {
      isCorrect = false;
      pointsPenalty = penaltyVal;
    }
  }

  const formatKickoffTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePredictClick = (choice) => {
    if (isLocked && !isAdmin) return;
    onPredict(match.id, choice);
  };

  const getCardBorderColor = () => {
    if (actualResult) {
      return prediction ? (isCorrect ? '2px solid #52c41a' : '2px solid #ff4d4f') : '1px solid rgba(255,255,255,0.08)';
    }
    return prediction ? '1px solid #d4b106' : '1px solid rgba(255,255,255,0.08)';
  };

  return (
    <Card
      className="glass-card"
      style={{
        border: getCardBorderColor(),
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: 14,
        overflow: 'hidden'
      }}
      styles={{ body: { padding: 18 } }}
    >
      {/* Header Info */}
      <div className="flex justify-between items-center mb-3">
        <Tag color="blue" bordered={false} style={{ fontSize: '10px', fontWeight: 'bold' }}>
          {match.stage === 'group' ? `BẢNG ${match.group} • LƯỢT ${match.matchday}` : 
           match.stage === 'r32' ? 'VÒNG 32 ĐỘI' :
           match.stage === 'r16' ? 'VÒNG 16 ĐỘI' :
           match.stage === 'qf' ? 'TỨ KẾT' :
           match.stage === 'sf' ? 'BÁN KẾT' :
           match.stage === 'third_place' ? 'TRANH HẠNG 3' : 'CHUNG KẾT'}
        </Tag>
        
        {isLocked ? (
          <Tag color="red" bordered={false} icon={<LockOutlined />} style={{ fontSize: '10px' }}>
            Đã khóa
          </Tag>
        ) : (
          <Tag color="green" bordered={false} icon={<UnlockOutlined />} style={{ fontSize: '10px' }}>
            Có thể dự đoán
          </Tag>
        )}
      </div>

      {/* Matchup Teams Display */}
      <Row align="middle" justify="space-between" className="my-4 text-center">
        {/* Team A */}
        <Col span={9} className="flex flex-col items-center gap-2">
          {flagA ? (
            <img 
              src={flagA} 
              alt={teamAName} 
              className="flag-img"
              style={{ width: 44, height: 30, objectFit: 'cover', borderRadius: 4, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }} 
            />
          ) : (
            <div style={{ width: 44, height: 30, background: '#1e293b', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏳️</div>
          )}
          <Text strong style={{ color: '#fff', fontSize: '13px', display: 'block', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 6 }}>
            {teamAName}
          </Text>
        </Col>

        {/* VS Indicator */}
        <Col span={6}>
          <div className="flex flex-col items-center">
            <span style={{ fontSize: '10px', color: '#64748b', letterSpacing: 2, fontWeight: 800 }}>VS</span>
          </div>
        </Col>

        {/* Team B */}
        <Col span={9} className="flex flex-col items-center gap-2">
          {flagB ? (
            <img 
              src={flagB} 
              alt={teamBName} 
              className="flag-img"
              style={{ width: 44, height: 30, objectFit: 'cover', borderRadius: 4, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }} 
            />
          ) : (
            <div style={{ width: 44, height: 30, background: '#1e293b', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏳️</div>
          )}
          <Text strong style={{ color: '#fff', fontSize: '13px', display: 'block', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 6 }}>
            {teamBName}
          </Text>
        </Col>
      </Row>

      {/* Info venue/date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
        <Text style={{ fontSize: '11px', color: '#94a3b8' }}>
          <EnvironmentOutlined style={{ marginRight: 6, color: '#38bdf8' }} /> {match.venue}
        </Text>
        <Text style={{ fontSize: '11px', color: '#94a3b8' }}>
          <CalendarOutlined style={{ marginRight: 6, color: '#fbbf24' }} /> {formatKickoffTime(match.date)}
        </Text>
      </div>

      {/* Prediction actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            type={prediction === 'A' ? 'primary' : 'default'}
            danger={prediction === 'A'}
            onClick={() => handlePredictClick('A')}
            disabled={isLocked && !isAdmin}
            style={{
              flex: 1,
              fontSize: '11px',
              fontWeight: 700,
              height: 36,
              background: prediction === 'A' ? '#00f5a0' : 'rgba(255,255,255,0.03)',
              borderColor: prediction === 'A' ? '#00f5a0' : 'rgba(255,255,255,0.1)',
              color: prediction === 'A' ? '#0f172a' : '#94a3b8'
            }}
          >
            Thắng A
          </Button>

          <Button
            type={prediction === 'D' ? 'primary' : 'default'}
            onClick={() => handlePredictClick('D')}
            disabled={isLocked && !isAdmin}
            style={{
              flex: 1,
              fontSize: '11px',
              fontWeight: 700,
              height: 36,
              background: prediction === 'D' ? '#ffd700' : 'rgba(255,255,255,0.03)',
              borderColor: prediction === 'D' ? '#ffd700' : 'rgba(255,255,255,0.1)',
              color: prediction === 'D' ? '#0f172a' : '#94a3b8'
            }}
          >
            Hòa
          </Button>

          <Button
            type={prediction === 'B' ? 'primary' : 'default'}
            onClick={() => handlePredictClick('B')}
            disabled={isLocked && !isAdmin}
            style={{
              flex: 1,
              fontSize: '11px',
              fontWeight: 700,
              height: 36,
              background: prediction === 'B' ? '#38bdf8' : 'rgba(255,255,255,0.03)',
              borderColor: prediction === 'B' ? '#38bdf8' : 'rgba(255,255,255,0.1)',
              color: prediction === 'B' ? '#0f172a' : '#94a3b8'
            }}
          >
            Thắng B
          </Button>
        </div>
      </div>

      {/* Result score display */}
      {actualResult && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text style={{ fontSize: '11px', color: '#64748b', marginRight: 6 }}>Kết quả:</Text>
            <Tag color="cyan" style={{ fontSize: '11px', fontWeight: 'bold' }}>
              {actualResult === 'A' ? `${teamAName} thắng` : actualResult === 'D' ? 'Hòa' : `${teamBName} thắng`}
            </Tag>
          </div>
          <div>
            {prediction ? (
              isCorrect ? (
                <Tag color="green" icon={<CheckCircleFilled />} style={{ fontWeight: 'bold', fontSize: '11px' }}>
                  +0đ Phạt
                </Tag>
              ) : (
                <Tag color="red" icon={<CloseCircleFilled />} style={{ fontWeight: 'bold', fontSize: '11px' }}>
                  +{penaltyVal}đ Phạt
                </Tag>
              )
            ) : (
              <Tag color="warning" icon={<CloseCircleFilled />} style={{ fontWeight: 'bold', fontSize: '11px' }}>
                Không đoán (+{penaltyVal}đ Phạt)
              </Tag>
            )}
          </div>
        </div>
      )}

      {/* Admin Quick Editor */}
      {isAdmin && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #d4b106', background: 'rgba(212, 177, 6, 0.05)', padding: 8, borderRadius: 8 }}>
          <Text strong style={{ fontSize: '10px', color: '#d4b106', display: 'block', marginBottom: 6 }}>
            ⚙️ CẬP NHẬT KẾT QUẢ (ADMIN):
          </Text>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            <Button size="small" type={actualResult === 'A' ? 'primary' : 'default'} onClick={() => onSetResult(match.id, 'A')} style={{ flex: 1, fontSize: 10 }}>A Thắng</Button>
            <Button size="small" type={actualResult === 'D' ? 'primary' : 'default'} onClick={() => onSetResult(match.id, 'D')} style={{ flex: 1, fontSize: 10 }}>Hòa</Button>
            <Button size="small" type={actualResult === 'B' ? 'primary' : 'default'} onClick={() => onSetResult(match.id, 'B')} style={{ flex: 1, fontSize: 10 }}>B Thắng</Button>
            <Button size="small" danger onClick={() => onSetResult(match.id, null)} style={{ fontSize: 10 }} icon={<RetweetOutlined />} title="Reset" />
          </div>
          
          {match.stage !== 'group' && (
            <div style={{ display: 'flex', gap: 4 }}>
              <Input
                size="small"
                placeholder={match.teamAName}
                defaultValue={match.teamAInfo ? '' : match.teamAName}
                onChange={(e) => onSetResult(match.id, 'editTeams', { teamAName: e.target.value })}
                style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9 }}
                addonBefore={<EditOutlined style={{ fontSize: 8 }} />}
              />
              <Input
                size="small"
                placeholder={match.teamBName}
                defaultValue={match.teamBInfo ? '' : match.teamBName}
                onChange={(e) => onSetResult(match.id, 'editTeams', { teamBName: e.target.value })}
                style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9 }}
                addonBefore={<EditOutlined style={{ fontSize: 8 }} />}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
