import React, { useState } from 'react';
import { Card, Button, Tag, Space, Typography, Row, Col, Input, Badge, Modal, Tooltip, Avatar } from 'antd';
import { TEAMS } from '../data/wcData';
import { LockOutlined, UnlockOutlined, CheckCircleFilled, CloseCircleFilled, EnvironmentOutlined, CalendarOutlined, EditOutlined, RetweetOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function MatchCard({
  match,
  prediction,
  onPredict,
  isAdmin,
  onSetResult,
  isLocked,
  penaltiesConfig,
  players
}) {
  const [showAnalysis, setShowAnalysis] = useState(false);
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
      id={`match-card-${match.id}`}
      className={`glass-card ${!isLocked ? 'predictable-match' : ''}`}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLocked ? (
            <Tag color="red" bordered={false} icon={<LockOutlined />} style={{ fontSize: '10px', margin: 0 }}>
              Đã khóa
            </Tag>
          ) : (
            <Tag color="green" bordered={false} icon={<UnlockOutlined />} style={{ fontSize: '10px', margin: 0 }}>
              Có thể dự đoán
            </Tag>
          )}

          <Tooltip title="Xem phân tích dự đoán">
            <button
              onClick={() => setShowAnalysis(true)}
              style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 6,
                padding: '2px 7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: '#38bdf8',
                fontSize: 11,
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
              }}
            >
              Chi tiết <EyeOutlined style={{ fontSize: 12 }} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ===== PREDICTION ANALYSIS MODAL ===== */}
      <PredictionAnalysisModal
        open={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        match={match}
        players={players || []}
        teamAName={teamAName}
        teamBName={teamBName}
        flagA={flagA}
        flagB={flagB}
        teamAInfo={teamAInfo}
        teamBInfo={teamBInfo}
        actualResult={actualResult}
      />

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
            {match.score ? (
              <span style={{ fontSize: '16px', color: '#fff', fontWeight: 900, background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)' }}>{match.score}</span>
            ) : (
              <span style={{ fontSize: '10px', color: '#64748b', letterSpacing: 2, fontWeight: 800 }}>VS</span>
            )}
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

// ============================================================
// PREDICTION ANALYSIS MODAL COMPONENT
// ============================================================
function PredictionAnalysisModal({ open, onClose, match, players, teamAName, teamBName, flagA, flagB, teamAInfo, teamBInfo, actualResult }) {
  // Count votes
  const votingPlayers = players.filter(p => p.id !== 'ADMIN_WC' && p.predictions && p.predictions[match.id]);
  const total = votingPlayers.length;
  const countA = votingPlayers.filter(p => p.predictions[match.id] === 'A').length;
  const countD = votingPlayers.filter(p => p.predictions[match.id] === 'D').length;
  const countB = votingPlayers.filter(p => p.predictions[match.id] === 'B').length;

  const pctA = total > 0 ? Math.round((countA / total) * 100) : 0;
  const pctD = total > 0 ? Math.round((countD / total) * 100) : 0;
  const pctB = total > 0 ? Math.round((countB / total) * 100) : 0;

  // Who picked what
  const pickersA = votingPlayers.filter(p => p.predictions[match.id] === 'A').map(p => p.id);
  const pickersD = votingPlayers.filter(p => p.predictions[match.id] === 'D').map(p => p.id);
  const pickersB = votingPlayers.filter(p => p.predictions[match.id] === 'B').map(p => p.id);

  const getFlagUrl = (teamInfo) => {
    if (teamInfo && teamInfo.iso) {
      return `https://flagcdn.com/w80/${teamInfo.iso.toLowerCase()}.png`;
    }
    return null;
  };

  const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 45%)`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  const bars = [
    {
      label: `🏆 ${teamAName} Thắng`,
      pct: pctA,
      count: countA,
      pickers: pickersA,
      color: '#00f5a0',
      glow: 'rgba(0,245,160,0.4)',
      bg: 'linear-gradient(135deg, rgba(0,245,160,0.15) 0%, rgba(0,245,160,0.05) 100%)',
      result: 'A'
    },
    {
      label: '🤝 Hòa',
      pct: pctD,
      count: countD,
      pickers: pickersD,
      color: '#ffd700',
      glow: 'rgba(255,215,0,0.4)',
      bg: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)',
      result: 'D'
    },
    {
      label: `🏆 ${teamBName} Thắng`,
      pct: pctB,
      count: countB,
      pickers: pickersB,
      color: '#38bdf8',
      glow: 'rgba(56,189,248,0.4)',
      bg: 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(56,189,248,0.05) 100%)',
      result: 'B'
    }
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      closeIcon={<div style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: 4 }}><CloseCircleFilled /></div>}
      styles={{
        content: {
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(6, 8, 20, 0.98))',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 24,
          boxShadow: '0 0 80px rgba(56, 189, 248, 0.15), 0 30px 60px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1)',
          backdropFilter: 'blur(25px)',
          padding: 0,
          overflow: 'hidden'
        },
        mask: {
          backdropFilter: 'blur(8px)',
          background: 'rgba(0,0,0,0.85)'
        }
      }}
    >
      {/* Modal Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(0,245,160,0.1) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '24px 32px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)', borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 15px rgba(56,189,248,0.2)' }}>
            <EyeOutlined style={{ color: '#38bdf8', fontSize: 16 }} />
            <span style={{ color: '#38bdf8', fontSize: 12, fontWeight: 800, letterSpacing: 1.5 }}>PHÂN TÍCH DỰ ĐOÁN</span>
          </div>
          {actualResult && (
            <Tag
              color={actualResult === 'A' ? 'green' : actualResult === 'D' ? 'gold' : 'blue'}
              style={{ fontWeight: 800, fontSize: 12, padding: '4px 10px', borderRadius: 8, border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
            >
              KẾT QUẢ: {actualResult === 'A' ? `${teamAName} THẮNG` : actualResult === 'D' ? 'HÒA' : `${teamBName} THẮNG`}
            </Tag>
          )}
        </div>

        {/* Teams matchup display */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
            {flagA ? (
              <img src={flagA} alt={teamAName} style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 8, boxShadow: '0 6px 16px rgba(0,0,0,0.5)' }} />
            ) : (
              <div style={{ width: 64, height: 44, background: '#1e293b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏳️</div>
            )}
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{teamAName}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600, letterSpacing: 2 }}>VS</span>
            <div style={{ width: 2, height: 24, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
            {flagB ? (
              <img src={flagB} alt={teamBName} style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 8, boxShadow: '0 6px 16px rgba(0,0,0,0.5)' }} />
            ) : (
              <div style={{ width: 64, height: 44, background: '#1e293b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏳️</div>
            )}
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{teamBName}</span>
          </div>
        </div>
      </div>

      {/* Modal Body */}
      <div style={{ padding: '24px 32px 32px' }}>
        {/* Summary stats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px dashed rgba(255,255,255,0.08)' }}>
          <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            TỔNG LƯỢT DỰ ĐOÁN
          </span>
          <div style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 24, padding: '4px 16px', boxShadow: '0 0 20px rgba(56,189,248,0.1)' }}>
            <span style={{ color: '#38bdf8', fontSize: 16, fontWeight: 900 }}>{total}</span>
            <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 6, fontWeight: 600 }}>NGƯỜI CHƠI</span>
          </div>
        </div>

        {total === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📊</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Trận đấu này chưa có lượt dự đoán nào</div>
            <div style={{ fontSize: 12, marginTop: 8, color: '#334155' }}>Hãy là người đầu tiên đưa ra nhận định!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {bars.map((bar) => {
              const isWinner = actualResult === bar.result;
              return (
                <div
                  key={bar.result}
                  style={{
                    background: isWinner ? bar.bg : 'rgba(255,255,255,0.02)',
                    border: isWinner ? `1px solid ${bar.color}60` : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 16,
                    padding: '16px 20px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: isWinner ? `0 0 30px ${bar.glow}` : '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                >
                  {/* Label row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: bar.color, fontSize: 14, fontWeight: 800, textShadow: `0 0 10px ${bar.glow}` }}>{bar.label}</span>
                      {isWinner && (
                        <Tag color="success" style={{ margin: 0, fontWeight: 800, borderRadius: 12, fontSize: 10, border: 'none' }}>CHÍNH XÁC</Tag>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>{bar.count} người</span>
                      <span style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: bar.pct > 0 ? bar.color : '#334155',
                        minWidth: 50,
                        textAlign: 'right',
                        textShadow: bar.pct > 0 ? `0 0 15px ${bar.glow}` : 'none'
                      }}>{bar.pct}%</span>
                    </div>
                  </div>

                  {/* Bar track */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 99, height: 10, overflow: 'hidden', marginBottom: bar.pickers.length > 0 ? 16 : 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${bar.pct}%`,
                        background: `linear-gradient(90deg, ${bar.color}, ${bar.color}ee)`,
                        borderRadius: 99,
                        boxShadow: `0 0 12px ${bar.glow}`,
                        transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}
                    />
                  </div>

                  {/* Pickers list */}
                  {bar.pickers.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {bar.pickers.map(pid => (
                        <Tooltip key={pid} title={pid}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: `linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))`,
                            border: `1px solid rgba(255,255,255,0.06)`,
                            borderRadius: 20,
                            padding: '3px 10px 3px 3px',
                            transition: 'all 0.2s hover:transform translateY(-2px)'
                          }}>
                            <Avatar size={20} style={{ backgroundColor: getAvatarColor(pid), fontSize: 10, fontWeight: 'bold' }}>
                              {getInitials(pid)}
                            </Avatar>
                            <span style={{ color: '#cbd5e1', fontSize: 11, fontWeight: 600 }}>
                              {pid}
                            </span>
                          </div>
                        </Tooltip>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 500, letterSpacing: 0.5 }}>Dữ liệu hiển thị dự đoán của tất cả người chơi (ẩn Admin)</span>
        </div>
      </div>
    </Modal>
  );
}
