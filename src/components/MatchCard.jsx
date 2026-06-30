import React, { useState } from 'react';
import { Card, Button, Tag, Space, Typography, Row, Col, Input, Badge, Modal, Tooltip, Avatar, Tabs } from 'antd';
import { TEAMS } from '../data/wcData';
import { LockOutlined, UnlockOutlined, CheckCircleFilled, CloseCircleFilled, EnvironmentOutlined, CalendarOutlined, EditOutlined, RetweetOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const TEAM_NAME_TO_CODE = {
  "mexico": "MEX", "south africa": "RSA", "south korea": "KOR", "korea republic": "KOR",
  "czech republic": "CZE", "czechia": "CZE", "canada": "CAN", "bosnia and herzegovina": "BIH",
  "bosnia": "BIH", "qatar": "QAT", "switzerland": "SUI", "brazil": "BRA", "morocco": "MAR",
  "haiti": "HAI", "scotland": "SCO", "united states": "USA", "usa": "USA", "us": "USA",
  "paraguay": "PAR", "australia": "AUS", "turkey": "TUR", "türkiye": "TUR", "germany": "GER",
  "curacao": "CUW", "curaçao": "CUW", "ivory coast": "CIV", "côte d'ivoire": "CIV", "cote d'ivoire": "CIV",
  "ecuador": "ECU", "netherlands": "NED", "japan": "JPN", "sweden": "SWE", "tunisia": "TUN",
  "belgium": "BEL", "egypt": "EGY", "iran": "IRN", "ir iran": "IRN", "new zealand": "NZL",
  "spain": "ESP", "cape verde": "CPV", "cabo verde": "CPV", "saudi arabia": "KSA", "uruguay": "URU",
  "france": "FRA", "senegal": "SEN", "iraq": "IRQ", "norway": "NOR", "argentina": "ARG",
  "austria": "AUT", "jordan": "JOR", "algeria": "ALG", "portugal": "POR", "democratic republic of the congo": "COD",
  "dr congo": "COD", "congo dr": "COD", "uzbekistan": "UZB", "colombia": "COL", "england": "ENG",
  "croatia": "CRO", "ghana": "GHA", "panama": "PAN"
};

const cleanScorerName = (name) => {
  if (!name) return "";
  return name.replace(/\s+\d+(?:\+\d+)?'?\s*(og|o\.g|pen|penalty)\b/gi, '').trim();
};

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

  const homeGoals = [];
  const awayGoals = [];
  if (match.details && match.details.goals) {
    match.details.goals
      .forEach(g => {
        const gTeamLower = (g.team || "").toLowerCase().trim();
        const code = TEAM_NAME_TO_CODE[gTeamLower] || g.team;
        const isHome = code === match.teamA || g.team === 'home' || gTeamLower.includes((teamAName || "").toLowerCase());
        const cleanG = {
          ...g,
          scorer: cleanScorerName(g.scorer)
        };
        if (isHome) {
          homeGoals.push(cleanG);
        } else {
          awayGoals.push(cleanG);
        }
      });
  }

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

  const getKnockoutResultText = () => {
    if (actualResult === 'A') return `${teamAName} thắng`;
    if (actualResult === 'B') return `${teamBName} thắng`;
    if (actualResult === 'D') {
      if (match.stage !== 'group') {
        const winnerCode = match.details && match.details.winner;
        const winnerName = winnerCode === match.teamA ? teamAName : (winnerCode === match.teamB ? teamBName : (winnerCode ? (TEAMS[winnerCode] ? TEAMS[winnerCode].name : winnerCode) : ''));
        if (winnerName) {
          return `Hòa trong 90p - ${winnerName} thắng`;
        }
      }
      return 'Hòa';
    }
    return '';
  };

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
              <>
                <span style={{ fontSize: '16px', color: '#fff', fontWeight: 900, background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', display: 'inline-block' }}>
                  {match.score.split('(')[0].trim()}
                </span>
                {/* Dòng dưới hiển thị kết quả hiệp phụ và pen */}
                {(() => {
                  let subText = "";
                  
                  if (match.score.includes('(')) {
                    const infoPart = match.score.split('(')[1].replace(')', '').trim();
                    if (infoPart.toLowerCase().includes('pen')) {
                      // Định dạng lại từ "Pen 4 - 3" thành "(3-4 pen)" hoặc tương đương
                      const matchPen = infoPart.match(/(?:Pen|pen)\s*(\d+)\s*-\s*(\d+)/);
                      if (matchPen) {
                        subText = `(${matchPen[1]}-${matchPen[2]} pen)`;
                      } else {
                        subText = `(${infoPart.replace(/pen/i, 'pen').trim()})`;
                      }
                    } else if (infoPart.toLowerCase().includes('hiệp phụ') || infoPart.toLowerCase().includes('aet')) {
                      subText = "(Hiệp phụ)";
                    }
                  } else if (match.details) {
                    const pen = match.details.penalties;
                    const penHome = pen ? (pen.home !== undefined && pen.home !== null ? pen.home : pen.homeScore) : null;
                    const penAway = pen ? (pen.away !== undefined && pen.away !== null ? pen.away : pen.awayScore) : null;
                    if (penHome !== undefined && penHome !== null && penHome !== "") {
                      subText = `(${penHome}-${penAway} pen)`;
                    } else if (match.details.extraTime) {
                      subText = "(Hiệp phụ)";
                    }
                  }
                  
                  if (subText) {
                    return (
                      <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, marginTop: 4, display: 'block', whiteSpace: 'nowrap' }}>
                        {subText}
                      </span>
                    );
                  }
                  return null;
                })()}
              </>
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

      {/* Danh sách cầu thủ ghi bàn */}
      {match.details && match.details.goals && match.details.goals.length > 0 && (
        <Row style={{ marginBottom: 12, marginTop: -4, fontSize: '10px', color: '#94a3b8', lineHeight: '1.4' }}>
          <Col span={11} style={{ textAlign: 'right', paddingRight: 10, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            {homeGoals.map((g, idx) => (
              <div key={idx} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {g.scorer} {g.minute}' {g.type === 'penalty' ? '(Pen)' : g.type === 'own_goal' ? '(OG)' : ''}
              </div>
            ))}
          </Col>
          <Col span={2} style={{ textAlign: 'center', opacity: 0.4 }}>⚽</Col>
          <Col span={11} style={{ textAlign: 'left', paddingLeft: 10 }}>
            {awayGoals.map((g, idx) => (
              <div key={idx} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {g.scorer} {g.minute}' {g.type === 'penalty' ? '(Pen)' : g.type === 'own_goal' ? '(OG)' : ''}
              </div>
            ))}
          </Col>
        </Row>
      )}

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
              {getKnockoutResultText()}
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

  const timelineEvents = [];
  if (match.details) {
    if (match.details.goals) {
      match.details.goals
        .forEach(g => {
          const gTeamLower = (g.team || "").toLowerCase().trim();
          const code = TEAM_NAME_TO_CODE[gTeamLower] || g.team;
          const isHome = code === match.teamA || g.team === 'home';
          timelineEvents.push({
            minute: g.minute,
            type: 'goal',
            team: isHome ? 'home' : 'away',
            title: cleanScorerName(g.scorer),
            desc: g.assist ? `Kiến tạo: ${cleanScorerName(g.assist)}` : '',
            goalType: g.type
          });
        });
    }
    if (match.details.cards) {
      match.details.cards
        .forEach(c => {
          const cTeamLower = (c.team || "").toLowerCase().trim();
          const code = TEAM_NAME_TO_CODE[cTeamLower] || c.team;
          const isHome = code === match.teamA || c.team === 'home';
          timelineEvents.push({
            minute: c.minute,
            type: 'card',
            team: isHome ? 'home' : 'away',
            title: cleanScorerName(c.player),
            color: c.color
          });
        });
    }
    if (match.details.substitutions) {
      match.details.substitutions
        .forEach(s => {
          const sTeamLower = (s.team || "").toLowerCase().trim();
          const code = TEAM_NAME_TO_CODE[sTeamLower] || s.team;
          const isHome = code === match.teamA || s.team === 'home';
          timelineEvents.push({
            minute: s.minute,
            type: 'sub',
            team: isHome ? 'home' : 'away',
            title: `${s.info && s.info.name ? cleanScorerName(s.info.name) : 'Cầu thủ'} ↔ ${cleanScorerName(s.player) || ''}`
          });
        });
    }
    timelineEvents.sort((a, b) => a.minute - b.minute);
  }

  const pen = match.details && (match.details.penalties || match.details.penaltyShootout);

  const matchInfoTab = (
    <div style={{ color: '#cbd5e1' }}>
      {match.details ? (
        <>
          {/* Thông tin chung */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 14,
            padding: 14,
            marginBottom: 20,
            fontSize: 12,
            color: '#94a3b8',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <div>📍 <strong>Sân vận động:</strong> {match.venue}</div>
            {match.details.referee && (
              <div>🏁 <strong>Trọng tài:</strong> {match.details.referee.name} ({match.details.referee.country})</div>
            )}
            {match.details.weather && (
              <div>🌤️ <strong>Thời tiết:</strong> {match.details.weather.tempC || match.details.weather.temp || 'N/A'}°C, độ ẩm {match.details.weather.humidity || 'N/A'}%, gió {match.details.weather.windKph || match.details.weather.wind || 'N/A'} km/h</div>
            )}
            {match.details.captains && (
              <div>🎖️ <strong>Đội trưởng:</strong> {match.details.captains.home || 'Chưa rõ'} (đội A) • {match.details.captains.away || 'Chưa rõ'} (đội B)</div>
            )}
          </div>

          {/* Dòng thời gian trận đấu */}
          <div style={{ color: '#38bdf8', fontSize: 12, fontWeight: 'bold', marginBottom: 14, letterSpacing: 1 }}>
            ⏱️ DIỄN BIẾN TRẬN ĐẤU (TIMELINE)
          </div>

          {timelineEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: 11 }}>
              Không có sự kiện đặc biệt nào được ghi nhận.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', paddingRight: 6 }}>
              {timelineEvents.map((evt, idx) => {
                const isHome = evt.team === 'home';
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: isHome ? 'flex-start' : 'flex-end', width: '100%' }}>
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 10,
                      padding: '6px 12px',
                      maxWidth: '85%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexDirection: isHome ? 'row' : 'row-reverse'
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 'bold', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', borderRadius: 4, padding: '2px 5px' }}>
                        {evt.minute}'
                      </span>
                      {evt.type === 'goal' && (
                        <>
                          <span>⚽</span>
                          <span style={{ fontWeight: 'bold', color: '#fff', fontSize: 11 }}>{evt.title}</span>
                          {evt.desc && <span style={{ fontSize: 10, color: '#64748b' }}>({evt.desc})</span>}
                          {evt.goalType === 'penalty' && <span style={{ fontSize: 9, color: '#fbbf24' }}>(Pen)</span>}
                          {evt.goalType === 'own_goal' && <span style={{ fontSize: 9, color: '#ff4d4f' }}>(OG)</span>}
                        </>
                      )}
                      {evt.type === 'card' && (
                        <>
                          <span style={{
                            display: 'inline-block',
                            width: 8,
                            height: 12,
                            background: evt.color === 'yellow' ? '#ffd700' : '#ff4d4f',
                            borderRadius: 1.5,
                            boxShadow: `0 0 8px ${evt.color === 'yellow' ? 'rgba(255,215,0,0.4)' : 'rgba(255,77,79,0.4)'}`
                          }} />
                          <span style={{ color: '#e2e8f0', fontSize: 11 }}>{evt.title}</span>
                        </>
                      )}
                      {evt.type === 'sub' && (
                        <>
                          <span style={{ color: '#52c41a' }}>🔄</span>
                          <span style={{ color: '#94a3b8', fontSize: 11 }}>{evt.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sút luân lưu */}
          {pen && pen.kicks && pen.kicks.length > 0 && (
            <div style={{ marginTop: 20, padding: 12, background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.15)', borderRadius: 12 }}>
              <div style={{ color: '#fbbf24', fontSize: 12, fontWeight: 'bold', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🎯</span> SÚT LUÂN LƯU (PENALTY SHOOTOUT)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                {pen.kicks.map((kick, kIdx) => {
                  const kickTeamLower = (kick.team || "").toLowerCase().trim();
                  const kickCode = TEAM_NAME_TO_CODE[kickTeamLower] || kick.team;
                  const isHomeKick = kickCode === match.teamA || kick.team === 'home';
                  return (
                    <div key={kIdx} style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Lượt {kick.order || (kIdx + 1)}: {kick.kicker} ({isHomeKick ? teamAName : teamBName})</span>
                      <span style={{ fontWeight: 'bold', color: kick.success ? '#52c41a' : '#ff4d4f' }}>
                        {kick.success ? 'Thành công' : 'Không thành công (' + (kick.outcome || 'Hỏng') + ')'}
                      </span>
                    </div>
                  );
                })}
                <div style={{ marginTop: 8, textAlign: 'center', fontWeight: 'bold', color: '#fff', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6 }}>
                  Chung cuộc: {teamAName} {pen.homeScore} - {pen.awayScore} {teamBName}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏱️</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Chưa có thông số sự kiện trận đấu</div>
          <div style={{ fontSize: 11, marginTop: 8, color: '#334155' }}>Dữ liệu chi tiết sẽ được cập nhật tự động khi trận đấu diễn ra!</div>
        </div>
      )}
    </div>
  );

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
        <div style={{ display: 'flex', alignItems: 'center', justifyBeweenn: 'space-between', marginBottom: 20, justifyContent: 'space-between' }}>
          <div style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)', borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 15px rgba(56,189,248,0.2)' }}>
            <EyeOutlined style={{ color: '#38bdf8', fontSize: 16 }} />
            <span style={{ color: '#38bdf8', fontSize: 12, fontWeight: 800, letterSpacing: 1.5 }}>CHI TIẾT TRẬN ĐẤU</span>
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
            {match.score ? (
              <span style={{ fontSize: '18px', color: '#fff', fontWeight: 900, background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)' }}>{match.score}</span>
            ) : (
              <>
                <span style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600, letterSpacing: 2 }}>VS</span>
                <div style={{ width: 2, height: 24, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.2), transparent)' }} />
              </>
            )}
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

      {/* Modal Body with Tabs */}
      <div style={{ padding: '16px 24px 24px' }} className="details-modal-tabs">
        <Tabs
          defaultActiveKey="predictions"
          centered
          styles={{
            tabBar: { borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }
          }}
          items={[
            {
              key: 'predictions',
              label: <span style={{ fontSize: 12, fontWeight: 'bold' }}>📊 DỰ ĐOÁN ({total})</span>,
              children: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottom: '1px dashed rgba(255,255,255,0.08)' }}>
                    <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                      TỔNG LƯỢT DỰ ĐOÁN
                    </span>
                    <div style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 24, padding: '2px 12px' }}>
                      <span style={{ color: '#38bdf8', fontSize: 14, fontWeight: 900 }}>{total}</span>
                      <span style={{ color: '#94a3b8', fontSize: 10, marginLeft: 4, fontWeight: 600 }}>NGƯỜI CHƠI</span>
                    </div>
                  </div>

                  {total === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#475569' }}>
                      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📊</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Trận đấu này chưa có lượt dự đoán nào</div>
                      <div style={{ fontSize: 11, marginTop: 6, color: '#334155' }}>Hãy là người đầu tiên đưa ra nhận định!</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {bars.map((bar) => {
                        const isWinner = actualResult === bar.result;
                        return (
                          <div
                            key={bar.result}
                            style={{
                              background: isWinner ? bar.bg : 'rgba(255,255,255,0.02)',
                              border: isWinner ? `1px solid ${bar.color}60` : '1px solid rgba(255,255,255,0.05)',
                              borderRadius: 14,
                              padding: '12px 16px',
                              position: 'relative',
                              overflow: 'hidden',
                              boxShadow: isWinner ? `0 0 20px ${bar.glow}` : '0 4px 10px rgba(0,0,0,0.15)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: bar.color, fontSize: 13, fontWeight: 800 }}>{bar.label}</span>
                                {isWinner && (
                                  <Tag color="success" style={{ margin: 0, fontWeight: 800, borderRadius: 10, fontSize: 9, border: 'none' }}>TRÚNG</Tag>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{ color: '#94a3b8', fontSize: 11 }}>{bar.count} người</span>
                                <span style={{ fontSize: 16, fontWeight: 950, color: bar.pct > 0 ? bar.color : '#334155' }}>{bar.pct}%</span>
                              </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 99, height: 8, overflow: 'hidden', marginBottom: bar.pickers.length > 0 ? 12 : 0 }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${bar.pct}%`,
                                  background: bar.color,
                                  borderRadius: 99,
                                  boxShadow: `0 0 8px ${bar.glow}`
                                }}
                              />
                            </div>

                            {bar.pickers.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {bar.pickers.map(pid => (
                                  <Tooltip key={pid} title={pid}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      background: `rgba(255,255,255,0.02)`,
                                      border: `1px solid rgba(255,255,255,0.05)`,
                                      borderRadius: 16,
                                      padding: '2px 8px 2px 2px'
                                    }}>
                                      <Avatar size={18} style={{ backgroundColor: getAvatarColor(pid), fontSize: 9, fontWeight: 'bold' }}>
                                        {getInitials(pid)}
                                      </Avatar>
                                      <span style={{ color: '#cbd5e1', fontSize: 10, fontWeight: 600 }}>
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

                  <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <span style={{ fontSize: 10, color: '#475569', fontWeight: 500 }}>Dự đoán của người chơi (ẩn Admin)</span>
                  </div>
                </div>
              )
            },
            {
              key: 'match_info',
              label: <span style={{ fontSize: 12, fontWeight: 'bold' }}>⚽ THÔNG SỐ TRẬN ĐẤU</span>,
              children: matchInfoTab
            }
          ]}
        />
      </div>
    </Modal>
  );
}
