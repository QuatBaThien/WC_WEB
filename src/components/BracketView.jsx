import React, { useState } from 'react';
import { Tooltip, Badge, Typography } from 'antd';
import { TrophyFilled, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { TEAMS } from '../data/wcData';

const { Text } = Typography;

export default function BracketView({
  matches,
  predictions = {},
  currentUserId,
  onPredict,
  lockedMatches = {},
  isAdmin = false,
  onBack
}) {
  // Trạng thái hover đội bóng để bắt vết đường đi (Path highlight)
  const [hoveredTeam, setHoveredTeam] = useState(null);

  // Helper lấy cờ
  const getFlagUrl = (teamCode) => {
    const teamInfo = TEAMS[teamCode];
    if (teamInfo && teamInfo.iso) {
      return `https://flagcdn.com/w80/${teamInfo.iso.toLowerCase()}.png`;
    }
    return null;
  };

  // Helper lấy tên hiển thị
  const getTeamName = (teamCode, fallbackName) => {
    const teamInfo = TEAMS[teamCode];
    return teamInfo ? teamInfo.name : fallbackName;
  };

  // Kiểm tra khóa
  const isMatchLocked = (match) => {
    if (isAdmin) return false;
    if (lockedMatches && lockedMatches[match.id] !== undefined) {
      return lockedMatches[match.id];
    }
    return new Date() > new Date(match.date);
  };

  // Trả về trận đấu từ ID
  const getMatchById = (id) => matches.find(m => m.id === id);

  // Cây nhị phân nhánh TRÁI (Hội tụ từ Vòng 32 -> Bán Kết 1)
  const leftTreeData = {
    id: 'sf_1',
    children: [
      {
        id: 'qf_1',
        children: [
          {
            id: 'r16_1',
            children: [
              { id: 'r32_2' },
              { id: 'r32_5' }
            ]
          },
          {
            id: 'r16_2',
            children: [
              { id: 'r32_1' },
              { id: 'r32_3' }
            ]
          }
        ]
      },
      {
        id: 'qf_2',
        children: [
          {
            id: 'r16_5',
            children: [
              { id: 'r32_11' },
              { id: 'r32_12' }
            ]
          },
          {
            id: 'r16_6',
            children: [
              { id: 'r32_9' },
              { id: 'r32_10' }
            ]
          }
        ]
      }
    ]
  };

  // Cây nhị phân nhánh PHẢI (Hội tụ từ Vòng 32 -> Bán Kết 2)
  const rightTreeData = {
    id: 'sf_2',
    children: [
      {
        id: 'qf_3',
        children: [
          {
            id: 'r16_3',
            children: [
              { id: 'r32_4' },
              { id: 'r32_6' }
            ]
          },
          {
            id: 'r16_4',
            children: [
              { id: 'r32_7' },
              { id: 'r32_8' }
            ]
          }
        ]
      },
      {
        id: 'qf_4',
        children: [
          {
            id: 'r16_7',
            children: [
              { id: 'r32_14' },
              { id: 'r32_16' }
            ]
          },
          {
            id: 'r16_8',
            children: [
              { id: 'r32_13' },
              { id: 'r32_15' }
            ]
          }
        ]
      }
    ]
  };

  // Kiểm tra xem đội bóng hovered có nằm trong nhánh con của node này không
  const checkTeamInNodeBranch = (node, hovered) => {
    if (!hovered) return false;
    const match = getMatchById(node.id);
    if (match) {
      const teamAVal = match.teamA;
      const teamBVal = match.teamB;
      const teamANameDisp = getTeamName(teamAVal, match.teamAName);
      const teamBNameDisp = getTeamName(teamBVal, match.teamBName);

      const isPlaceholderA = teamAVal && teamAVal.includes('_');
      const isPlaceholderB = teamBVal && teamBVal.includes('_');

      const matchA = (!isPlaceholderA && teamAVal && hovered.code === teamAVal) || (teamANameDisp && hovered.name === teamANameDisp);
      const matchB = (!isPlaceholderB && teamBVal && hovered.code === teamBVal) || (teamBNameDisp && hovered.name === teamBNameDisp);

      if (matchA || matchB) return true;
    }

    if (node.children) {
      return node.children.some(child => checkTeamInNodeBranch(child, hovered));
    }
    return false;
  };

  // Đăng ký sự kiện hover bắt vết
  const handleMouseEnter = (teamCode, teamName) => {
    const isPlaceholder = teamCode && teamCode.includes('_');
    setHoveredTeam({
      code: isPlaceholder ? null : teamCode,
      name: teamName
    });
  };

  const handleMouseLeave = () => {
    setHoveredTeam(null);
  };

  // Kiểm tra xem đội tuyển cụ thể có đang được highlight không
  const isTeamHighlighted = (teamCode, teamName) => {
    if (!hoveredTeam) return false;
    const isPlaceholder = teamCode && teamCode.includes('_');
    if (!isPlaceholder && teamCode && hoveredTeam.code === teamCode) return true;
    return teamName && hoveredTeam.name === teamName;
  };

  // Render thẻ trận đấu kiểu ESPN
  const renderMatchCard = (matchId) => {
    const match = getMatchById(matchId);
    if (!match) return null;

    const locked = isMatchLocked(match);
    const pred = predictions[match.id];
    const actualResult = match.result;

    const teamAVal = match.teamA;
    const teamBVal = match.teamB;
    const teamANameDisp = getTeamName(teamAVal, match.teamAName);
    const teamBNameDisp = getTeamName(teamBVal, match.teamBName);

    const flagA = getFlagUrl(teamAVal);
    const flagB = getFlagUrl(teamBVal);

    let scoreA = null;
    let scoreB = null;
    let isPredictionScore = false;

    if (match.score) {
      const mainScore = match.score.split('(')[0].trim();
      const parts = mainScore.split('-');
      if (parts.length === 2) {
        scoreA = parts[0].trim();
        scoreB = parts[1].trim();
      }
    } else if (pred && !locked) {
      scoreA = pred === 'A' ? 'W' : 'L';
      scoreB = pred === 'B' ? 'W' : 'L';
      isPredictionScore = true;
    }

    const isWinnerA = actualResult === 'A' || (!actualResult && pred === 'A');
    const isWinnerB = actualResult === 'B' || (!actualResult && pred === 'B');
    const hasAnyOutcome = actualResult || pred;

    const classTeamA = `bracket-team-row ${isTeamHighlighted(teamAVal, teamANameDisp) ? 'highlighted-team' : ''} ${
      hasAnyOutcome ? (isWinnerA ? 'winner-team' : 'loser-team') : ''
    }`;

    const classTeamB = `bracket-team-row ${isTeamHighlighted(teamBVal, teamBNameDisp) ? 'highlighted-team' : ''} ${
      hasAnyOutcome ? (isWinnerB ? 'winner-team' : 'loser-team') : ''
    }`;

    const isMatchHighlighted = hoveredTeam && (
      isTeamHighlighted(teamAVal, teamANameDisp) || isTeamHighlighted(teamBVal, teamBNameDisp)
    );

    const handleTeamClick = (choice) => {
      if (locked) return;
      if (!currentUserId) {
        alert('Vui lòng nhập Mã User để mở khóa dự đoán!');
        return;
      }
      onPredict(match.id, choice);
    };

    const isFinal = match.id === 'final';
    const isThirdPlace = match.id === 'third_place';
    const cardClass = `bracket-match-card ${isMatchHighlighted ? 'highlighted-match' : ''} ${
      isFinal ? 'final-match-card' : isThirdPlace ? 'third-place-match-card' : ''
    }`;

    return (
      <div className={cardClass}>
        <div className="bracket-match-meta">
          <span>
            {match.stage === 'r32' ? 'Vòng 32' :
             match.stage === 'r16' ? 'Vòng 16' :
             match.stage === 'qf' ? 'Tứ Kết' :
             match.stage === 'sf' ? 'Bán Kết' :
             match.stage === 'third_place' ? 'Tranh Hạng 3' : 'Chung Kết'}
          </span>
          {locked && <LockOutlined style={{ fontSize: 9, color: '#64748b' }} />}
        </div>

        {/* Đội A */}
        <Tooltip title={!locked ? `Click để chọn ${teamANameDisp} thắng` : ''} placement="top">
          <div 
            className={classTeamA}
            onMouseEnter={() => handleMouseEnter(teamAVal, teamANameDisp)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleTeamClick('A')}
          >
            <div className="bracket-team-info">
              {flagA ? (
                <img src={flagA} alt="" className="bracket-team-flag" />
              ) : (
                <div className="bracket-team-placeholder">?</div>
              )}
              <Text ellipsis style={{ color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit' }}>
                {teamANameDisp}
              </Text>
            </div>
            {scoreA !== null && (
              <div className={`bracket-score-box ${actualResult ? 'finished-score' : (isPredictionScore ? 'pred-score' : '')}`}>
                {scoreA}
              </div>
            )}
          </div>
        </Tooltip>

        {/* Đội B */}
        <Tooltip title={!locked ? `Click để chọn ${teamBNameDisp} thắng` : ''} placement="bottom">
          <div 
            className={classTeamB}
            onMouseEnter={() => handleMouseEnter(teamBVal, teamBNameDisp)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleTeamClick('B')}
          >
            <div className="bracket-team-info">
              {flagB ? (
                <img src={flagB} alt="" className="bracket-team-flag" />
              ) : (
                <div className="bracket-team-placeholder">?</div>
              )}
              <Text ellipsis style={{ color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit' }}>
                {teamBNameDisp}
              </Text>
            </div>
            {scoreB !== null && (
              <div className={`bracket-score-box ${actualResult ? 'finished-score' : (isPredictionScore ? 'pred-score' : '')}`}>
                {scoreB}
              </div>
            )}
          </div>
        </Tooltip>
      </div>
    );
  };

  // Render cây nhị phân đệ quy (Left hoặc Right)
  const renderTreeBranch = (node, side) => {
    const hasChildren = node.children && node.children.length > 0;
    const isHighlightedPath = hoveredTeam && checkTeamInNodeBranch(node, hoveredTeam);

    return (
      <div className={`bracket-node ${side} ${isHighlightedPath ? 'highlighted-path' : ''}`} key={node.id}>
        <div className="bracket-match-container">
          {renderMatchCard(node.id)}
        </div>
        {hasChildren && (
          <div className={`bracket-children ${isHighlightedPath ? 'highlighted-path' : ''}`}>
            {node.children.map(child => renderTreeBranch(child, side))}
          </div>
        )}
      </div>
    );
  };

  // Helper kiểm tra xem một đội có thắng một trận cụ thể không (hoặc thực tế hoặc dự đoán)
  const checkTeamWinsMatch = (matchId, team) => {
    if (!team) return false;
    const match = getMatchById(matchId);
    if (!match) return false;
    const pred = predictions[matchId];
    const actualResult = match.result;
    
    const teamAVal = match.teamA;
    const teamBVal = match.teamB;
    const teamANameDisp = getTeamName(teamAVal, match.teamAName);
    const teamBNameDisp = getTeamName(teamBVal, match.teamBName);

    const isMatchA = (team.code && teamAVal && team.code === teamAVal) || (team.name && teamANameDisp && team.name === teamANameDisp);
    const isMatchB = (team.code && teamBVal && team.code === teamBVal) || (team.name && teamBNameDisp && team.name === teamBNameDisp);

    if (isMatchA) {
      return actualResult === 'A' || (!actualResult && pred === 'A');
    }
    if (isMatchB) {
      return actualResult === 'B' || (!actualResult && pred === 'B');
    }
    return false;
  };

  // Helper kiểm tra xem một đội có tham gia một trận cụ thể không (hoặc thực tế hoặc dự đoán)
  const checkTeamInMatch = (matchId, team) => {
    if (!team) return false;
    const match = getMatchById(matchId);
    if (!match) return false;
    
    const teamAVal = match.teamA;
    const teamBVal = match.teamB;
    const teamANameDisp = getTeamName(teamAVal, match.teamAName);
    const teamBNameDisp = getTeamName(teamBVal, match.teamBName);

    const isMatchA = (team.code && teamAVal && team.code === teamAVal) || (team.name && teamANameDisp && team.name === teamANameDisp);
    const isMatchB = (team.code && teamBVal && team.code === teamBVal) || (team.name && teamBNameDisp && team.name === teamBNameDisp);

    return isMatchA || isMatchB;
  };

  // Tính toán highlight cho các đường nối ở cột giữa
  const isLeftToFinalHighlighted = hoveredTeam && checkTeamWinsMatch('sf_1', hoveredTeam);
  const isLeftToThirdHighlighted = hoveredTeam && checkTeamInMatch('sf_1', hoveredTeam) && !checkTeamWinsMatch('sf_1', hoveredTeam);
  const isRightToFinalHighlighted = hoveredTeam && checkTeamWinsMatch('sf_2', hoveredTeam);
  const isRightToThirdHighlighted = hoveredTeam && checkTeamInMatch('sf_2', hoveredTeam) && !checkTeamWinsMatch('sf_2', hoveredTeam);
  const isFinalToChampionHighlighted = hoveredTeam && checkTeamWinsMatch('final', hoveredTeam);

  // Lấy thông tin nhà vô địch
  const getChampionInfo = () => {
    const finalMatch = getMatchById('final');
    if (!finalMatch) return null;

    const actualResult = finalMatch.result;
    const predResult = predictions[finalMatch.id];

    if (actualResult) {
      const winnerCode = actualResult === 'A' ? finalMatch.teamA : finalMatch.teamB;
      const winnerName = actualResult === 'A' ? finalMatch.teamAName : finalMatch.teamBName;
      return { code: winnerCode, name: getTeamName(winnerCode, winnerName), isActual: true };
    } else if (predResult) {
      const winnerCode = predResult === 'A' ? finalMatch.teamA : finalMatch.teamB;
      const winnerName = predResult === 'A' ? finalMatch.teamAName : finalMatch.teamBName;
      return { code: winnerCode, name: getTeamName(winnerCode, winnerName), isActual: false };
    }
    return null;
  };

  const champion = getChampionInfo();

  return (
    <div className="flex flex-col w-full px-0 mt-0" style={{ overflow: 'hidden' }}>
      <div className="bracket-wrapper">
        <div className="bracket-content">
          {/* 1. CÁNH TRÁI (Flow từ ngoài vào trong: R32 -> SF1) */}
          <div className="bracket-tree-container">
            {renderTreeBranch(leftTreeData, 'left')}
          </div>

          {/* 2. CỘT GIỮA (Chung kết, Tranh hạng 3 & Bục Vô Địch kết nối bằng SVG) */}
          <div className="bracket-middle-column flex flex-col">
            {/* SVG Connectors Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
              {/* SF1 (Trái) -> Chung Kết */}
              <path 
                d="M 0 480 L 15 480 L 15 317 L 30 317" 
                className={`bracket-svg-path ${isLeftToFinalHighlighted ? 'highlighted' : ''}`}
              />
              {/* SF1 (Trái) -> Tranh Hạng 3 */}
              <path 
                d="M 0 480 L 15 480 L 15 720 L 48 720" 
                className={`bracket-svg-path ${isLeftToThirdHighlighted ? 'highlighted' : ''}`}
              />
              {/* SF2 (Phải) -> Chung Kết */}
              <path 
                d="M 240 480 L 225 480 L 225 317 L 210 317" 
                className={`bracket-svg-path ${isRightToFinalHighlighted ? 'highlighted' : ''}`}
              />
              {/* SF2 (Phải) -> Tranh Hạng 3 */}
              <path 
                d="M 240 480 L 225 480 L 225 720 L 192 720" 
                className={`bracket-svg-path ${isRightToThirdHighlighted ? 'highlighted' : ''}`}
              />
              {/* Chung Kết -> Nhà Vô Địch */}
              <path 
                d="M 120 272 L 120 240" 
                className={`bracket-svg-path ${isFinalToChampionHighlighted ? 'highlighted' : ''}`}
              />
            </svg>

            {/* Upper Half: Champion Box & Final Match */}
            <div className="flex flex-col justify-center items-center w-full flex-1 gap-8" style={{ height: '480px', zIndex: 10 }}>
              {/* Hộp Vô Địch */}
              <div className="bracket-champion-box" style={{ width: '180px' }}>
                <TrophyFilled style={{ color: '#ffd700', fontSize: 26, filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))' }} />
                <div style={{ color: '#ffd700', fontSize: 10, fontWeight: 900, marginTop: 4, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                  Nhà Vô Địch
                </div>
                {champion ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 4 }}>
                    {getFlagUrl(champion.code) && (
                      <img src={getFlagUrl(champion.code)} alt="" className="bracket-champion-flag" />
                    )}
                    <div style={{ color: '#fff', fontSize: 12, fontWeight: 800, marginTop: 6, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {champion.name}
                    </div>
                    <Badge 
                      status={champion.isActual ? 'success' : 'processing'} 
                      text={
                        <span style={{ fontSize: 8, fontWeight: 700, color: champion.isActual ? '#52c41a' : '#38bdf8', textTransform: 'uppercase' }}>
                          {champion.isActual ? 'Thực Tế' : 'Bạn Dự Đoán'}
                        </span>
                      } 
                      style={{ marginTop: 2 }}
                    />
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: 10, fontStyle: 'italic', marginTop: 8 }}>
                    Chưa xác định
                  </div>
                )}
              </div>

              {/* Trận Chung Kết */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <span style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.35)', color: '#ffd700', padding: '2px 10px', borderRadius: 10, fontSize: 9, fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    🏆 CHUNG KẾT
                  </span>
                </div>
                {renderMatchCard('final')}
              </div>
            </div>

            {/* Lower Half: Third Place Match */}
            <div className="flex flex-col justify-center items-center w-full flex-1" style={{ height: '480px', zIndex: 10 }}>
              {/* Trận Tranh Hạng 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '145px' }}>
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <span style={{ background: 'rgba(94, 234, 212, 0.12)', border: '1px solid rgba(94, 234, 212, 0.35)', color: '#5eead4', padding: '2px 10px', borderRadius: 10, fontSize: 9, fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    🥉 TRANH HẠNG 3
                  </span>
                </div>
                {renderMatchCard('third_place')}
              </div>
            </div>
          </div>

          {/* 3. CÁNH PHẢI (Flow từ trong ra ngoài: SF2 <- R32) */}
          <div className="bracket-tree-container">
            {renderTreeBranch(rightTreeData, 'right')}
          </div>
        </div>
      </div>
    </div>
  );
}
