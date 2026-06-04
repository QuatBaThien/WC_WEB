import React from 'react';
import { Table, Typography, Card, Badge, Space, Tag, Row, Col } from 'antd';
import { TrophyOutlined, TrophyFilled, ClockCircleOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { TEAMS, CHAMPION_OPTIONS } from '../data/wcData';

const { Text, Title } = Typography;

export default function Leaderboard({ players, matches, currentUserId, penaltiesConfig }) {
  
  // Tìm nhà vô địch chung cuộc (nếu trận chung kết đã đá xong)
  const finalMatch = matches.find(m => m.id === 'final');
  let championCode = null;
  let championName = null;
  if (finalMatch && finalMatch.result) {
    championCode = finalMatch.result === 'A' ? finalMatch.teamA : finalMatch.teamB;
    championName = finalMatch.result === 'A' ? finalMatch.teamAName : finalMatch.teamBName;
  }

  // 1. Tính toán thống kê cho từng người chơi
  const leaderboardData = players.map(player => {
    let correctCount = 0;
    let incorrectCount = 0;
    let penaltyPoints = 0;
    let totalPredicted = 0;

    matches.forEach(match => {
      const pred = player.predictions[match.id];
      const stagePenalty = (penaltiesConfig && penaltiesConfig[match.stage] !== undefined)
        ? Number(penaltiesConfig[match.stage])
        : 10;
      
      if (pred) {
        totalPredicted++;
        if (match.result) {
          if (pred === match.result) {
            correctCount++;
          } else {
            incorrectCount++;
            penaltyPoints += stagePenalty;
          }
        }
      } else {
        if (match.result) {
          incorrectCount++;
          penaltyPoints += stagePenalty;
        }
      }
    });

    // Tính toán điểm phạt từ dự đoán Vô địch
    let champWagerPoints = 0;
    let champReduction = 0;

    CHAMPION_OPTIONS.forEach(opt => {
      const wager = player.predictions[`CHAMP_${opt.code}`];
      if (wager) {
        const wagerNum = Number(wager);
        champWagerPoints += wagerNum;

        // Kiểm tra xem đội này có vô địch không
        const isWinner = (championCode && championCode.toUpperCase() === opt.code) ||
                         (championName && championName.trim().toUpperCase() === opt.name.toUpperCase());
        if (isWinner) {
          champReduction = Math.round(wagerNum * opt.odds);
        }
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
      champReduction
    };
  });

  // 2. Sắp xếp bảng xếp hạng
  const sortedLeaderboard = [...leaderboardData].sort((a, b) => {
    if (a.penaltyPoints !== b.penaltyPoints) {
      return a.penaltyPoints - b.penaltyPoints;
    }
    if (a.correctCount !== b.correctCount) {
      return b.correctCount - a.correctCount;
    }
    return b.totalPredicted - a.totalPredicted;
  });

  // Cột cho bảng
  const columns = [
    {
      title: 'Hạng',
      key: 'rank',
      align: 'center',
      width: 60,
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
        return (
          <Space>
            <Text strong style={{ color: isCurrent ? '#ffd700' : '#f8fafc', fontWeight: 700 }}>
              {text}
            </Text>
            {isCurrent && <Badge count="BẠN" style={{ backgroundColor: '#ffd700', color: '#000', fontWeight: 'bold' }} />}
          </Space>
        );
      }
    },
    {
      title: 'Đúng',
      dataIndex: 'correctCount',
      key: 'correctCount',
      align: 'center',
      width: 65,
      render: (text) => <Text style={{ color: '#00f5a0', fontWeight: 'bold' }}>{text}</Text>
    },
    {
      title: 'Sai',
      dataIndex: 'incorrectCount',
      key: 'incorrectCount',
      align: 'center',
      width: 65,
      render: (text) => <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{text}</Text>
    },
    {
      title: 'Đã đoán',
      dataIndex: 'totalPredicted',
      key: 'totalPredicted',
      align: 'center',
      width: 80,
      render: (text) => <Text style={{ color: '#94a3b8', fontSize: '11px' }}>{text}/104</Text>
    },
    {
      title: 'Cái giá phải trả',
      dataIndex: 'penaltyPoints',
      key: 'penaltyPoints',
      align: 'right',
      width: 150,
      render: (text) => <Text style={{ color: '#ffd700', fontSize: '16px', fontWeight: 900 }}>{text}</Text>
    }
  ];

  // Chi tiết dự đoán khi click mở rộng dòng
  const expandedRowRender = (playerRecord) => {
    const predictedMatches = matches.filter(m => playerRecord.predictions[m.id] || m.result);

    return (
      <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
        
        {/* Dự đoán Vô địch của người chơi */}
        <div style={{ marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
          <Title level={5} style={{ color: '#ffd700', fontSize: '11px', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            🏆 Dự đoán Vô Địch
          </Title>
          <Row gutter={[12, 12]}>
            {CHAMPION_OPTIONS.map(opt => {
              const wager = playerRecord.predictions[`CHAMP_${opt.code}`];
              if (!wager) return null;
              
              const isWinner = (championCode && championCode.toUpperCase() === opt.code) ||
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
              const pred = playerRecord.predictions[match.id];
              const teamAInfo = TEAMS[match.teamA];
              const teamBInfo = TEAMS[match.teamB];
              const teamAName = teamAInfo ? teamAInfo.name : match.teamAName;
              const teamBName = teamBInfo ? teamBInfo.name : match.teamBName;
              const isoA = teamAInfo ? teamAInfo.iso : null;
              const isoB = teamBInfo ? teamBInfo.iso : null;

              const isCorrect = pred === match.result;

              return (
                <Col xs={24} sm={12} md={8} key={match.id}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justify: 'space-between', fontSize: '10px', color: '#64748b' }}>
                      <span>Trận {match.id.toUpperCase()}</span>
                      <Tag size="small" color="blue" bordered={false} style={{ fontSize: 8, margin: 0, padding: '0 4px', height: 14, lineHeight: '14px' }}>{match.stage.toUpperCase()}</Tag>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="flex items-center gap-1.5 text-xs truncate max-w-[80px]" style={{ color: '#fff' }}>
                        {isoA && <img src={`https://flagcdn.com/w80/${isoA.toLowerCase()}.png`} style={{ width: 16, height: 11, objectFit: 'cover', borderRadius: 1,  marginRight: 5 }} alt="" />}
                        <span className="truncate">{teamAName}</span>
                      </span>
                      <span style={{ fontSize: 9, color: '#475569' }}>vs</span>
                      <span className="flex items-center gap-1.5 text-xs truncate max-w-[80px] justify-end" style={{ color: '#fff' }}>
                        <span className="truncate">{teamBName}</span>
                        {isoB && <img src={`https://flagcdn.com/w80/${isoB.toLowerCase()}.png`} style={{ width: 16, height: 11, objectFit: 'cover', borderRadius: 1 , marginLeft: 5}} alt="" />}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justify: 'space-between', fontSize: 11, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 4 }}>
                      <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                        Dự đoán: <Text strong style={{ color: pred === 'A' ? '#00f5a0' : pred === 'D' ? '#ffd700' : pred === 'B' ? '#38bdf8' : '#f43f5e' }}>
                          {pred === 'A' ? 'Thắng A' : pred === 'D' ? 'Hòa' : pred === 'B' ? 'Thắng B' : 'Chưa đoán'}
                        </Text>
                      </Text>
                      {match.result ? (
                        <Text style={{ fontSize: 10, color: isCorrect ? '#00f5a0' : '#ff4d4f', fontWeight: 'bold', marginLeft: 5 }}>
                          {isCorrect ? <CheckCircleOutlined /> : <CloseCircleOutlined />}  {match.result === 'A' ? 'A thắng' : match.result === 'D' ? 'Hòa' : 'B thắng'}
                        </Text>
                      ) : (
                        <Text style={{ fontSize: 10, color: '#d4b106', marginLeft: 5  }}>Chưa đá</Text>
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
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }}
      styles={{ body: { padding: 18 } }}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrophyOutlined style={{ color: '#ffd700', fontSize: 20 }} className="animate-pulse" />
        <Title level={4} style={{ color: '#fff', margin: 0, fontSize: 16, letterSpacing: 1 }}>
          BẢNG XẾP HẠNG NHÓM
        </Title>
      </div>

      <Table
        dataSource={sortedLeaderboard}
        columns={columns}
        pagination={false}
        size="small"
        expandable={{
          expandedRowRender,
          expandRowByClick: true
        }}
        rowClassName={(record) => record.id === currentUserId ? 'antd-current-row' : ''}
        style={{
          background: 'transparent'
        }}
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
