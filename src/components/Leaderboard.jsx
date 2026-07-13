import React, { useState } from 'react';
import { Table, Typography, Card, Badge, Space, Tag, Row, Col, Button, Modal, Tooltip } from 'antd';
import {
  TrophyOutlined, TrophyFilled, InfoCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
  CopyOutlined, CheckOutlined, CrownOutlined
} from '@ant-design/icons';
import { TEAMS, CHAMPION_OPTIONS, getActualScore, isScorePredictionCorrect, getScorePredictionReward } from '../data/wcData';

const { Text, Title } = Typography;

export default function Leaderboard({
  players,
  matches,
  currentUserId,
  penaltiesConfig,
  onCopyPredictions,   // (targetPlayerId) => void
  lockedMatches = {},  // để tính số trận chưa khóa có thể copy
  onFollowLeader       // NEW prop
}) {

  const [copyingId, setCopyingId]       = useState(null); // đang xử lý
  const [copiedId,  setCopiedId]        = useState(null); // vừa copy xong

  // ── Tìm nhà vô địch (nếu chung kết đã đá) ──────────────────
  const finalMatch   = matches.find(m => m.id === 'final');
  let championCode   = null;
  let championName   = null;
  if (finalMatch && finalMatch.result) {
    championCode = finalMatch.result === 'A' ? finalMatch.teamA : finalMatch.teamB;
    championName = finalMatch.result === 'A' ? finalMatch.teamAName : finalMatch.teamBName;
  }

  // ── Helper: trận chưa bị khóa (chưa diễn ra) ───────────────
  const isMatchUnlocked = (match) => {
    if (lockedMatches[match.id] !== undefined) return !lockedMatches[match.id];
    return new Date() < new Date(match.date);
  };

  // ── Đếm số trận chưa đá mà player đó đã đoán ────────────────
  const countCopyableMatches = (playerPredictions) => {
    return matches.filter(m => isMatchUnlocked(m) && playerPredictions[m.id]).length;
  };

  // ── Xử lý click Copy ─────────────────────────────────────────
  const handleCopyClick = (targetPlayer) => {
    const copyable = countCopyableMatches(targetPlayer.predictions);
    Modal.confirm({
      title: (
        <span style={{ color: '#ffd700', fontWeight: 700 }}>
          Copy dự đoán của {targetPlayer.id}?
        </span>
      ),
      content: (
        <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
          Sẽ copy <span style={{ color: '#00f5a0', fontWeight: 700 }}>{copyable} dự đoán</span> từ{' '}
          <span style={{ color: '#ffd700', fontWeight: 700 }}>{targetPlayer.id}</span> vào tài khoản bạn.<br />
          <span style={{ color: '#64748b', fontSize: 11 }}>
            (Chỉ những trận <b>chưa diễn ra</b> — dự đoán trận đã đá sẽ giữ nguyên)
          </span>
          <br /><br />
          <span style={{ color: '#f97316', fontSize: 12 }}>
            ⚠ Nhớ bấm <b>"Gửi dự đoán"</b> sau đó để lưu lên hệ thống!
          </span>
        </div>
      ),
      okText: `Copy ${copyable} dự đoán`,
      cancelText: 'Huỷ',
      okButtonProps: {
        style: {
          background: 'linear-gradient(135deg,#ffd700,#d97706)',
          borderColor: '#ffd700',
          color: '#000',
          fontWeight: 700,
        },
      },
      centered: true,
      onOk: async () => {
        setCopyingId(targetPlayer.id);
        await onCopyPredictions(targetPlayer.id);
        setCopyingId(null);
        setCopiedId(targetPlayer.id);
        setTimeout(() => setCopiedId(null), 3000);
      },
    });
  };

  // ── Xử lý click Chọn Minh Chủ ─────────────────────────────────
  const handleFollowClick = (targetPlayer) => {
    const currentUserPlayer = players.find(p => p.id === currentUserId);
    const currentFollowingId = currentUserPlayer?.predictions?.following;

    const copyable = countCopyableMatches(targetPlayer.predictions);

    let title, content;
    if (currentFollowingId) {
      title = (
        <span style={{ color: '#ffd700', fontWeight: 700 }}>
          Thay đổi Minh Chủ?
        </span>
      );
      content = (
        <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
          Bạn đang theo dõi Minh chủ <span style={{ color: '#ffd700', fontWeight: 700 }}>{currentFollowingId}</span>.<br />
          Bạn có chắc chắn muốn đổi sang Minh chủ mới <span style={{ color: '#00f5a0', fontWeight: 700 }}>{targetPlayer.id}</span>?<br />
          Toàn bộ <span style={{ color: '#00f5a0', fontWeight: 700 }}>{copyable} dự đoán chưa diễn ra</span> của {targetPlayer.id} sẽ được copy đè và lưu ngay lập tức.
        </div>
      );
    } else {
      title = (
        <span style={{ color: '#ffd700', fontWeight: 700 }}>
          Chọn Minh Chủ?
        </span>
      );
      content = (
        <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
          Bạn muốn chọn <span style={{ color: '#ffd700', fontWeight: 700 }}>{targetPlayer.id}</span> làm Minh Chủ?<br />
          Toàn bộ <span style={{ color: '#00f5a0', fontWeight: 700 }}>{copyable} dự đoán chưa diễn ra</span> của {targetPlayer.id} sẽ được copy sang tài khoản của bạn và lưu ngay lập tức.<br />
          Về sau, khi Minh Chủ cập nhật dự đoán, tài khoản của bạn cũng sẽ tự động đồng bộ theo.
        </div>
      );
    }

    Modal.confirm({
      title,
      content,
      okText: currentFollowingId ? 'Đổi Minh Chủ' : 'Chọn Minh Chủ',
      cancelText: 'Huỷ',
      okButtonProps: {
        style: {
          background: 'linear-gradient(135deg, #ffd700, #d97706)',
          borderColor: '#ffd700',
          color: '#000',
          fontWeight: 700,
        },
      },
      centered: true,
      onOk: async () => {
        if (onFollowLeader) {
          await onFollowLeader(targetPlayer.id);
        }
      },
    });
  };

  // ── Tính toán leaderboard ─────────────────────────────────────
  const leaderboardData = players.map(player => {
    let correctCount   = 0;
    let incorrectCount = 0;
    let penaltyPoints  = 0;
    let totalPredicted = 0;

    matches.forEach(match => {
      const pred         = player.predictions[match.id];
      const stagePenalty = (penaltiesConfig && penaltiesConfig[match.stage] !== undefined)
        ? Number(penaltiesConfig[match.stage])
        : 10;

      if (pred) {
        totalPredicted++;
        if (match.result) {
          if (pred === match.result) { correctCount++; }
          else { incorrectCount++; penaltyPoints += stagePenalty; }
        }
      } else {
        if (match.result) { incorrectCount++; penaltyPoints += stagePenalty; }
      }

      if (match.stage === 'sf' || match.stage === 'third_place' || match.stage === 'final') {
        const scoreKey = `${match.id}_score`;
        const predScore = player.predictions[scoreKey];
        if (predScore && match.result && match.score) {
          const actualScore = getActualScore(match.score);
          if (actualScore) {
            const isScoreCorrect = isScorePredictionCorrect(predScore, actualScore);
            if (isScoreCorrect) {
              let scoreReward = getScorePredictionReward(predScore, match.stage, stagePenalty);
              
              // Jackpot check (sole predictor of this correct score)
              const activePlayers = players.filter(p => p.id !== 'ADMIN_WC' && p.predictions);
              const totalPickersOfThisScore = activePlayers.filter(p => p.predictions[scoreKey] === predScore).length;
              if (totalPickersOfThisScore === 1) {
                scoreReward += Math.round(stagePenalty * 0.5);
              }
              
              penaltyPoints -= scoreReward;
            }
          }
        }
      }
    });

    let champWagerPoints = 0;
    let champReduction   = 0;
    CHAMPION_OPTIONS.forEach(opt => {
      const wager = player.predictions[`CHAMP_${opt.code}`];
      if (wager) {
        const wagerNum = Number(wager);
        champWagerPoints += wagerNum;
        const isWinner =
          (championCode && championCode.toUpperCase() === opt.code) ||
          (championName && championName.trim().toUpperCase() === opt.name.toUpperCase());
        if (isWinner) champReduction = Math.round(wagerNum * opt.odds);
      }
    });

    penaltyPoints += (champWagerPoints - champReduction);

    return {
      key: player.id,
      id: player.id,
      name: player.id,
      totalPredicted,
      correctCount,
      incorrectCount,
      penaltyPoints,
      predictions: player.predictions,
      lastUpdated: player.lastUpdated || null,
      champWagerPoints,
      champReduction,
    };
  });

  const sortedLeaderboard = [...leaderboardData].sort((a, b) => {
    if (a.penaltyPoints !== b.penaltyPoints) return a.penaltyPoints - b.penaltyPoints;
    if (a.correctCount  !== b.correctCount)  return b.correctCount  - a.correctCount;
    return b.totalPredicted - a.totalPredicted;
  });

  // ── Columns ───────────────────────────────────────────────────
  const columns = [
    {
      title: 'Hạng',
      key: 'rank',
      align: 'center',
      width: 46,
      render: (_, __, index) => {
        const rank = index + 1;
        if (rank === 1) return <TrophyFilled style={{ color: '#ffd700', fontSize: 18 }} />;
        if (rank === 2) return <TrophyFilled style={{ color: '#cbd5e1', fontSize: 16 }} />;
        if (rank === 3) return <TrophyFilled style={{ color: '#d97706', fontSize: 16 }} />;
        return <Text strong style={{ color: '#64748b' }}>{rank}</Text>;
      }
    },
    {
      title: 'Mã User',
      dataIndex: 'id',
      key: 'id',
      render: (text) => {
        const isCurrent = text === currentUserId;
        const followers = players.filter(p => p.predictions?.following === text);
        const isMinhChu = followers.length > 0;

        return (
          <Space size={6} wrap={false} style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
            {isMinhChu && <CrownOutlined style={{ color: '#ffd700', fontSize: 13, flexShrink: 0 }} />}
            <Text strong style={{ 
              color: isCurrent ? '#ffd700' : isMinhChu ? '#fcd34d' : '#f8fafc', 
              fontWeight: 700, 
              fontSize: 12,
              whiteSpace: 'nowrap',
              display: 'inline-block'
            }}>
              {text}
            </Text>
            {isCurrent && (
              <Badge
                count="BẠN"
                style={{ backgroundColor: '#ffd700', color: '#000', fontWeight: 'bold', fontSize: 9, whiteSpace: 'nowrap', flexShrink: 0 }}
              />
            )}
            {isMinhChu && (
              <span style={{ color: '#64748b', fontSize: 10 }} className="hidden-xs">({followers.length} follow)</span>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Copy',
      key: 'copy',
      align: 'center',
      width: 72,
      render: (_, record) => {
        const isCurrent = record.id === currentUserId;
        const canCopy   = !isCurrent && !!currentUserId && currentUserId !== 'ADMIN_WC';
        if (!canCopy) return null;

        const copyable  = countCopyableMatches(record.predictions);
        const isCopying = copyingId === record.id;
        const isCopied  = copiedId  === record.id;

        return (
          <Tooltip
            title={
              copyable > 0
                ? `Sao chép ${copyable} dự đoán chưa đá của ${record.id}`
                : `${record.id} chưa đoán trận nào chưa diễn ra`
            }
            placement="left"
          >
            <Button
              size="small"
              icon={isCopied ? <CheckOutlined /> : <CopyOutlined />}
              loading={isCopying}
              disabled={copyable === 0 || isCopying}
              onClick={(e) => {
                e.stopPropagation();
                handleCopyClick(record);
              }}
              style={{
                width: 60,
                height: 26,
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 8,
                background: isCopied
                  ? 'rgba(0,245,160,0.15)'
                  : copyable > 0
                    ? 'rgba(255,215,0,0.12)'
                    : 'rgba(255,255,255,0.04)',
                borderColor: isCopied
                  ? '#00f5a0'
                  : copyable > 0
                    ? '#ffd700'
                    : 'rgba(255,255,255,0.1)',
                color: isCopied
                  ? '#00f5a0'
                  : copyable > 0
                    ? '#ffd700'
                    : '#475569',
                transition: 'all 0.25s',
              }}
            >
              {isCopied ? '✓' : copyable > 0 ? copyable : '—'}
            </Button>
          </Tooltip>
        );
      }
    },
    {
      title: 'Minh Chủ',
      key: 'minh_chu',
      align: 'center',
      width: 110,
      responsive: ['md'],
      render: (_, record) => {
        const currentUserPlayer = players.find(p => p.id === currentUserId);
        const currentUserFollowingId = currentUserPlayer?.predictions?.following;
        const recordFollowingId = record.predictions?.following;
        
        const isCurrent = record.id === currentUserId;
        const canFollow = !!currentUserId && currentUserId !== 'ADMIN_WC';

        if (!canFollow) return null;

        // If this record has a leader already, show their leader's ID
        if (recordFollowingId) {
          return (
            <Tag color="gold" style={{ margin: 0, fontWeight: 'bold', fontSize: 9 }}>
              Theo: {recordFollowingId}
            </Tag>
          );
        }

        // If this is the logged-in user themselves (and has no leader, since the check above didn't fire)
        if (isCurrent) {
          return <Text style={{ color: '#64748b', fontSize: 11 }}>—</Text>;
        }

        // If the current user is following this record
        if (currentUserFollowingId === record.id) {
          return (
            <Tag color="success" style={{ margin: 0, fontWeight: 'bold', fontSize: 9 }}>
              Đang theo dõi
            </Tag>
          );
        }

        if (record.id === 'ADMIN_WC') return null;

        return (
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleFollowClick(record);
            }}
            style={{
              height: 22,
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #ffd700, #d97706)',
              borderColor: '#ffd700',
              color: '#000',
              padding: '0 8px',
            }}
          >
            Chọn
          </Button>
        );
      }
    },
    {
      title: 'Đúng',
      dataIndex: 'correctCount',
      key: 'correctCount',
      align: 'center',
      width: 55,
      responsive: ['sm'],
      render: (text) => <Text style={{ color: '#00f5a0', fontWeight: 'bold' }}>{text}</Text>
    },
    {
      title: 'Sai',
      dataIndex: 'incorrectCount',
      key: 'incorrectCount',
      align: 'center',
      width: 48,
      responsive: ['sm'],
      render: (text) => <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{text}</Text>
    },
    {
      title: 'Đã đoán',
      dataIndex: 'totalPredicted',
      key: 'totalPredicted',
      align: 'center',
      width: 75,
      responsive: ['sm'],
      render: (text) => <Text style={{ color: '#94a3b8', fontSize: '11px' }}>{text}/104</Text>
    },
    {
      title: (
        <>
          <span className="hidden-xs">Cái giá phải trả</span>
          <span className="visible-xs">Phạt</span>
        </>
      ),
      dataIndex: 'penaltyPoints',
      key: 'penaltyPoints',
      align: 'right',
      width: 100,
      render: (text) => (
        <Text style={{ color: '#ffd700', fontSize: '16px', fontWeight: 900 }}>{text}</Text>
      )
    },
  ];

  // ── Expanded row ──────────────────────────────────────────────
  const expandedRowRender = (playerRecord) => {
    const predictedMatches = matches.filter(
      m => playerRecord.predictions[m.id] || m.result
    );

    return (
      <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>

        {/* Mobile-Friendly Stat & Action Summary Card */}
        <div 
          className="visible-xs"
          style={{ 
            marginBottom: 16, 
            background: 'rgba(30, 41, 59, 0.4)', 
            padding: 12, 
            borderRadius: 10, 
            border: '1px solid rgba(255,255,255,0.06)' 
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {/* Stat 1: Đúng */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Đoán Đúng</div>
              <div style={{ fontSize: 16, color: '#00f5a0', fontWeight: 'bold', marginTop: 2 }}>{playerRecord.correctCount}</div>
            </div>
            {/* Stat 2: Sai */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Đoán Sai</div>
              <div style={{ fontSize: 16, color: '#ff4d4f', fontWeight: 'bold', marginTop: 2 }}>{playerRecord.incorrectCount}</div>
            </div>
            {/* Stat 3: Đã đoán */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Đã đoán</div>
              <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 'bold', marginTop: 4 }}>{playerRecord.totalPredicted}/104</div>
            </div>
            {/* Stat 4: Minh Chủ Action */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: 6, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', marginBottom: 2, fontWeight: 600 }}>Minh Chủ</div>
              {(() => {
                const currentUserPlayer = players.find(p => p.id === currentUserId);
                const currentUserFollowingId = currentUserPlayer?.predictions?.following;
                const recordFollowingId = playerRecord.predictions?.following;
                const isCurrent = playerRecord.id === currentUserId;
                const canFollow = !!currentUserId && currentUserId !== 'ADMIN_WC';

                if (recordFollowingId) {
                  return (
                    <Tag color="gold" style={{ margin: 0, fontWeight: 'bold', fontSize: 9, padding: '0 4px' }}>
                      Theo: {recordFollowingId}
                    </Tag>
                  );
                }
                if (isCurrent) {
                  return <span style={{ color: '#64748b', fontSize: 11 }}>—</span>;
                }
                if (currentUserFollowingId === playerRecord.id) {
                  return (
                    <Tag color="success" style={{ margin: 0, fontWeight: 'bold', fontSize: 9, padding: '0 4px' }}>
                      Đang theo
                    </Tag>
                  );
                }
                if (playerRecord.id === 'ADMIN_WC' || !canFollow) {
                  return <span style={{ color: '#475569', fontSize: 11 }}>Khóa</span>;
                }
                return (
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollowClick(playerRecord);
                    }}
                    style={{
                      height: 18,
                      fontSize: 8,
                      fontWeight: 700,
                      borderRadius: 4,
                      background: 'linear-gradient(135deg, #ffd700, #d97706)',
                      borderColor: '#ffd700',
                      color: '#000',
                      padding: '0 6px',
                      lineHeight: '16px'
                    }}
                  >
                    Chọn
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Dự đoán Vô địch */}
        <div style={{ marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
          <Title level={5} style={{ color: '#ffd700', fontSize: '11px', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            🏆 Dự đoán Vô Địch
          </Title>
          <Row gutter={[12, 12]}>
            {CHAMPION_OPTIONS.map(opt => {
              const wager = playerRecord.predictions[`CHAMP_${opt.code}`];
              if (!wager) return null;
              const isWinner =
                (championCode && championCode.toUpperCase() === opt.code) ||
                (championName && championName.trim().toUpperCase() === opt.name.toUpperCase());
              return (
                <Col xs={12} sm={6} key={opt.code}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 'bold' }}>{opt.name}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Odds: x{opt.odds}</div>
                    <div style={{ fontSize: 11, color: '#ffd700', fontWeight: 'bold', marginTop: 4 }}>Cược: {wager}đ Phạt</div>
                    {championCode && (
                      <div style={{ fontSize: 10, marginTop: 4, fontWeight: 'bold', color: isWinner ? '#00f5a0' : '#ff4d4f' }}>
                        {isWinner ? `Trúng (Giảm -${Math.round(wager * opt.odds)}đ)` : 'Trượt (Phạt nguyên)'}
                      </div>
                    )}
                  </div>
                </Col>
              );
            })}
            {playerRecord.champWagerPoints === 0 && (
              <Col span={24}>
                <Text style={{ color: '#64748b', fontSize: 11, fontStyle: 'italic' }}>Không tham gia dự đoán Vô địch.</Text>
              </Col>
            )}
          </Row>
        </div>

        <Title level={5} style={{ color: '#38bdf8', fontSize: '12px', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: 1 }}>
          🔮 Chi tiết dự đoán trận đấu của {playerRecord.id}
        </Title>
        {predictedMatches.length === 0 ? (
          <Text style={{ color: '#64748b', fontSize: 11 }}>Chưa có dự đoán nào được thực hiện.</Text>
        ) : (
          <Row gutter={[12, 12]}>
            {predictedMatches.map(match => {
              const pred      = playerRecord.predictions[match.id];
              const teamAInfo = TEAMS[match.teamA];
              const teamBInfo = TEAMS[match.teamB];
              const teamAName = teamAInfo ? teamAInfo.name : match.teamAName;
              const teamBName = teamBInfo ? teamBInfo.name : match.teamBName;
              const isoA      = teamAInfo ? teamAInfo.iso : null;
              const isoB      = teamBInfo ? teamBInfo.iso : null;
              const isCorrect = pred === match.result;

              return (
                <Col xs={24} sm={12} md={8} key={match.id}>
                  <div style={{ background: 'rgba(15,23,42,0.6)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                      <span>Trận {match.id.toUpperCase()}</span>
                      <Tag size="small" color="blue" bordered={false} style={{ fontSize: 8, margin: 0, padding: '0 4px', height: 14, lineHeight: '14px' }}>{match.stage.toUpperCase()}</Tag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="flex items-center gap-1.5 text-xs truncate max-w-[80px]" style={{ color: '#fff' }}>
                        {isoA && <img src={`https://flagcdn.com/w80/${isoA.toLowerCase()}.png`} style={{ width: 16, height: 11, objectFit: 'cover', borderRadius: 1, marginRight: 5 }} alt="" />}
                        <span className="truncate">{teamAName}</span>
                      </span>
                      <span style={{ fontSize: 9, color: '#475569' }}>vs</span>
                      <span className="flex items-center gap-1.5 text-xs truncate max-w-[80px] justify-end" style={{ color: '#fff' }}>
                        <span className="truncate">{teamBName}</span>
                        {isoB && <img src={`https://flagcdn.com/w80/${isoB.toLowerCase()}.png`} style={{ width: 16, height: 11, objectFit: 'cover', borderRadius: 1, marginLeft: 5 }} alt="" />}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 4 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                          Dự đoán:{' '}
                          <Text strong style={{ color: pred === 'A' ? '#00f5a0' : pred === 'D' ? '#ffd700' : pred === 'B' ? '#38bdf8' : '#f43f5e' }}>
                            {pred === 'A' ? 'Thắng A' : pred === 'D' ? 'Hòa' : pred === 'B' ? 'Thắng B' : 'Chưa đoán'}
                          </Text>
                        </Text>
                        {(match.stage === 'sf' || match.stage === 'third_place' || match.stage === 'final') && (() => {
                          const pScore = playerRecord.predictions[`${match.id}_score`];
                          return (
                            <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                              Tỉ số:{' '}
                              <Text strong style={{ color: '#fbbf24' }}>
                                {pScore || 'Chưa đoán'}
                              </Text>
                            </Text>
                          );
                        })()}
                      </div>
                      {match.result ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 10, color: isCorrect ? '#00f5a0' : '#ff4d4f', fontWeight: 'bold' }}>
                            {isCorrect ? <CheckCircleOutlined /> : <CloseCircleOutlined />}{' '}
                            {match.result === 'A' ? 'A thắng' : match.result === 'D' ? 'Hòa' : 'B thắng'}
                          </Text>
                          {(match.stage === 'sf' || match.stage === 'third_place' || match.stage === 'final') && (() => {
                            const pScore = playerRecord.predictions[`${match.id}_score`];
                            if (pScore && match.score) {
                              const actualScore = getActualScore(match.score);
                              const isScoreCorrect = isScorePredictionCorrect(pScore, actualScore);
                              const stagePenalty = (penaltiesConfig && penaltiesConfig[match.stage] !== undefined)
                                ? Number(penaltiesConfig[match.stage])
                                : 10;
                              let scoreReward = getScorePredictionReward(pScore, match.stage, stagePenalty);
                              let isJackpot = false;
                              if (isScoreCorrect) {
                                const activePlayers = players.filter(p => p.id !== 'ADMIN_WC' && p.predictions);
                                const totalPickers = activePlayers.filter(p => p.predictions[`${match.id}_score`] === pScore).length;
                                if (totalPickers === 1) {
                                  isJackpot = true;
                                  scoreReward += Math.round(stagePenalty * 0.5);
                                }
                              }
                              return (
                                <Text style={{ fontSize: 9, color: isScoreCorrect ? '#00f5a0' : '#858d99', fontWeight: isScoreCorrect ? 'bold' : 'normal' }}>
                                  {isScoreCorrect ? (isJackpot ? `Độc đắc tỉ số! (-${scoreReward}đ)` : `Trúng tỉ số (-${scoreReward}đ)`) : 'Sai tỉ số (+0đ)'}
                                </Text>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <Text style={{ fontSize: 10, color: '#d4b106', marginLeft: 5 }}>Chưa đá</Text>
                      )}
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    );
  };

  return (
    <Card
      style={{
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}
      styles={{ body: { padding: 18 } }}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrophyOutlined style={{ color: '#ffd700', fontSize: 20 }} className="animate-pulse" />
        <Title level={4} style={{ color: '#fff', margin: 0, fontSize: 16, letterSpacing: 1 }}>
          BẢNG XẾP HẠNG NHÓM
        </Title>
      </div>

      {/* Hint copy — chỉ hiện khi user đã đăng nhập và không phải admin */}
      {currentUserId && currentUserId !== 'ADMIN_WC' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.18)',
          borderRadius: 8, padding: '6px 10px', marginBottom: 12,
        }}>
          <CopyOutlined style={{ color: '#ffd700', fontSize: 12 }} />
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>
            Bấm nút <span style={{ color: '#ffd700', fontWeight: 700 }}>Copy (n)</span> trên dòng của bất kỳ ai để sao chép dự đoán các trận chưa đá sang cho bạn.
          </Text>
        </div>
      )}

      <Table
        dataSource={sortedLeaderboard}
        columns={columns}
        pagination={false}
        size="small"
        expandable={{
          expandedRowRender,
          expandRowByClick: false, // tắt click-row-to-expand vì có nút copy trong row
        }}
        rowClassName={(record) => record.id === currentUserId ? 'antd-current-row' : ''}
        style={{ background: 'transparent' }}
        className="wc-antd-table"
      />

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 12 }}>
        <InfoCircleOutlined style={{ color: '#64748b', fontSize: 10 }} />
        <Text style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
          * Quy tắc: Ít Điểm Phạt nhất &gt; Đoán đúng nhiều nhất &gt; Tổng trận đã đoán nhiều nhất
        </Text>
      </div>
    </Card>
  );
}
