import React, { useState, useEffect } from 'react';
import { ConfigProvider, Layout, Tabs, Select, Button, Space, Badge, Modal, Input, Form, Typography, Spin, Alert, Row, Col, Tag, theme as antdTheme } from 'antd';
import { TrophyFilled, SyncOutlined, LockOutlined, CrownOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons';
import Navbar from './components/Navbar';
import MatchCard from './components/MatchCard';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import LoginModal from './components/LoginModal';
import ChampionPanel from './components/ChampionPanel';
import { INITIAL_MATCHES, TEAMS, CHAMPION_OPTIONS } from './data/wcData';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

// --- HELPER FUNCTION: ALIGN FOLLOWERS' PREDICTIONS WITH THEIR LEADERS ---
const alignFollowersPredictions = (playersList, matchesList, locks) => {
  if (!playersList || playersList.length === 0) return [];

  const checkLocked = (matchId) => {
    if (locks && locks[matchId] !== undefined) return locks[matchId];
    const match = matchesList.find(m => m.id === matchId);
    if (!match) return false;
    return new Date() > new Date(match.date);
  };

  return playersList.map(player => {
    const following = player.predictions?.following;
    if (!following) return player;
    
    // Find leader
    const leader = playersList.find(p => p.id === following);
    if (!leader) return player;

    const alignedPreds = { ...player.predictions };

    // Align match predictions
    matchesList.forEach(match => {
      if (!checkLocked(match.id)) {
        const leaderPred = leader.predictions[match.id];
        if (leaderPred !== undefined) {
          alignedPreds[match.id] = leaderPred;
        } else {
          delete alignedPreds[match.id];
        }
      }
    });

    // Align champion predictions
    let champLocked = locks?.['CONFIG_LOCK_CHAMPION'];
    if (champLocked === undefined) {
      champLocked = new Date() > new Date('2026-06-12T02:00:00');
    }
    if (!champLocked) {
      CHAMPION_OPTIONS.forEach(opt => {
        const key = `CHAMP_${opt.code}`;
        const leaderPred = leader.predictions[key];
        if (leaderPred !== undefined) {
          alignedPreds[key] = leaderPred;
        } else {
          delete alignedPreds[key];
        }
      });
    }

    return {
      ...player,
      predictions: alignedPreds
    };
  });
};

export default function App() {
  // --- STATE ---
  const [matches, setMatches] = useState(() => {
    const localResults = localStorage.getItem('wc_matches_results');
    const localKnockoutTeams = localStorage.getItem('wc_knockout_teams');
    let baseMatches = [...INITIAL_MATCHES];
    
    if (localResults) {
      const results = JSON.parse(localResults);
      baseMatches = baseMatches.map(m => ({
        ...m,
        result: results[m.id] !== undefined ? results[m.id] : m.result
      }));
    }

    if (localKnockoutTeams) {
      const koTeams = JSON.parse(localKnockoutTeams);
      baseMatches = baseMatches.map(m => {
        if (m.stage !== 'group' && koTeams[m.id]) {
          return {
            ...m,
            teamAName: koTeams[m.id].teamAName || m.teamAName,
            teamBName: koTeams[m.id].teamBName || m.teamBName,
            teamA: koTeams[m.id].teamA || m.teamA,
            teamB: koTeams[m.id].teamB || m.teamB
          };
        }
        return m;
      });
    }

    return baseMatches;
  });

  const [players, setPlayers] = useState(() => {
    const localPlayers = localStorage.getItem('wc_players');
    const parsed = localPlayers ? JSON.parse(localPlayers) : [];
    
    const localLocks = localStorage.getItem('wc_locked_matches');
    const locks = localLocks ? JSON.parse(localLocks) : {};
    
    const localResults = localStorage.getItem('wc_matches_results');
    const results = localResults ? JSON.parse(localResults) : {};
    
    const localKnockoutTeams = localStorage.getItem('wc_knockout_teams');
    const koTeams = localKnockoutTeams ? JSON.parse(localKnockoutTeams) : {};

    const baseMatches = INITIAL_MATCHES.map(m => {
      const u = {
        ...m,
        result: results[m.id] !== undefined ? results[m.id] : m.result
      };
      if (m.stage !== 'group' && koTeams[m.id]) {
        u.teamAName = koTeams[m.id].teamAName || m.teamAName;
        u.teamBName = koTeams[m.id].teamBName || m.teamBName;
        u.teamA = koTeams[m.id].teamA || m.teamA;
        u.teamB = koTeams[m.id].teamB || m.teamB;
      }
      return u;
    });

    return alignFollowersPredictions(parsed, baseMatches, locks);
  });

  const [currentUserId, setCurrentUserId] = useState(() => {
    return localStorage.getItem('wc_current_user_id') || null;
  });

  const [lockedMatches, setLockedMatches] = useState(() => {
    const localLocks = localStorage.getItem('wc_locked_matches');
    return localLocks ? JSON.parse(localLocks) : {};
  });

  const [sheetUrl, setSheetUrl] = useState(() => {
    return localStorage.getItem('wc_sheet_url') || 'https://script.google.com/macros/s/AKfycbz9ULmK5O9TMY42hpUKgIH5-rcpQwFPob2RCoDuaNdZMDQiVlQfArcnfGdQDvPsNSVgbQ/exec';
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    const localUser = localStorage.getItem('wc_current_user_id');
    return localUser === 'ADMIN_WC';
  });

  const [userIp, setUserIp] = useState('');
  const [sheetConnected, setSheetConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('group'); 
  const [groupFilter, setGroupFilter] = useState('ALL'); 
  const [matchdayFilter, setMatchdayFilter] = useState('ALL'); 
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);

  // --- WELCOME & POPUP STATE ---
  const [showWelcome, setShowWelcome] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // --- PENALTIES CONFIG STATE ---
  const [penaltiesConfig, setPenaltiesConfig] = useState(() => {
    try {
      const localConfig = localStorage.getItem('wc_penalties_config');
      return localConfig ? JSON.parse(localConfig) : {
        group: 10,
        r32: 10,
        r16: 10,
        qf: 10,
        sf: 10,
        third_place: 10,
        final: 10
      };
    } catch (e) {
      return { group: 10, r32: 10, r16: 10, qf: 10, sf: 10, third_place: 10, final: 10 };
    }
  });

  useEffect(() => {
    localStorage.setItem('wc_penalties_config', JSON.stringify(penaltiesConfig));
  }, [penaltiesConfig]);

  // --- EFFECT CHO WELCOME SCREEN ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
      // Nếu chưa đăng nhập thì hiện Modal bắt buộc
      if (!currentUserId) {
        setShowLoginModal(true);
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [currentUserId]);

  // --- SYNC LOCAL STORAGE ---
  useEffect(() => {
    const results = {};
    const koTeams = {};
    matches.forEach(m => {
      if (m.result !== null) results[m.id] = m.result;
      if (m.stage !== 'group') {
        koTeams[m.id] = {
          teamAName: m.teamAName,
          teamBName: m.teamBName,
          teamA: m.teamA,
          teamB: m.teamB
        };
      }
    });
    localStorage.setItem('wc_matches_results', JSON.stringify(results));
    localStorage.setItem('wc_knockout_teams', JSON.stringify(koTeams));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('wc_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('wc_current_user_id', currentUserId);
    } else {
      localStorage.removeItem('wc_current_user_id');
    }
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('wc_locked_matches', JSON.stringify(lockedMatches));
  }, [lockedMatches]);

  useEffect(() => {
    localStorage.setItem('wc_sheet_url', sheetUrl);
    setSheetConnected(!!sheetUrl);
  }, [sheetUrl]);

  // --- GET USER IP ---
  useEffect(() => {
    const getIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setUserIp(data.ip);
      } catch (err) {
        console.error(err);
        setUserIp('127.0.0.1');
      }
    };
    getIp();
  }, []);

  // --- GOOGLE SHEETS DISPATCH ---
  useEffect(() => {
    if (sheetUrl) {
      syncWithSheet();
    }
  }, [sheetUrl]);

  const syncWithSheet = async (url = sheetUrl) => {
    if (!url) return;
    setLoading(true);
    try {
      const response = await fetch(`${url}?t=${Date.now()}`);
      if (!response.ok) throw new Error('Response error');
      const data = await response.json();
      
      let resolvedMatches = [...matches];
      if (data.matchesResults) {
        resolvedMatches = resolvedMatches.map(m => ({
          ...m,
          result: data.matchesResults[m.id] !== undefined ? data.matchesResults[m.id] : m.result
        }));
      }

      if (data.knockoutTeams) {
        resolvedMatches = resolvedMatches.map(m => {
          if (m.stage !== 'group' && data.knockoutTeams[m.id]) {
            return {
              ...m,
              teamAName: data.knockoutTeams[m.id].teamAName || m.teamAName,
              teamBName: data.knockoutTeams[m.id].teamBName || m.teamBName,
              teamA: data.knockoutTeams[m.id].teamA || m.teamA,
              teamB: data.knockoutTeams[m.id].teamB || m.teamB
            };
          }
          return m;
        });
      }

      if (data.matchesResults || data.knockoutTeams) {
        setMatches(resolvedMatches);
      }

      let resolvedLocks = { ...lockedMatches };
      if (data.lockedMatches) {
        resolvedLocks = data.lockedMatches;
        setLockedMatches(resolvedLocks);

        // Khôi phục penaltiesConfig từ lockedMatches
        const groupPen = data.lockedMatches['CONFIG_PENALTY_group'];
        const r32Pen = data.lockedMatches['CONFIG_PENALTY_r32'];
        const r16Pen = data.lockedMatches['CONFIG_PENALTY_r16'];
        const qfPen = data.lockedMatches['CONFIG_PENALTY_qf'];
        const sfPen = data.lockedMatches['CONFIG_PENALTY_sf'];
        const tpPen = data.lockedMatches['CONFIG_PENALTY_third_place'];
        const fnPen = data.lockedMatches['CONFIG_PENALTY_final'];

        setPenaltiesConfig({
          group: groupPen !== undefined ? Number(groupPen) : 10,
          r32: r32Pen !== undefined ? Number(r32Pen) : 10,
          r16: r16Pen !== undefined ? Number(r16Pen) : 10,
          qf: qfPen !== undefined ? Number(qfPen) : 10,
          sf: sfPen !== undefined ? Number(sfPen) : 10,
          third_place: tpPen !== undefined ? Number(tpPen) : 10,
          final: fnPen !== undefined ? Number(fnPen) : 10
        });
      }

      if (data.players) {
        const aligned = alignFollowersPredictions(data.players, resolvedMatches, resolvedLocks);
        setPlayers(aligned);
      }

      setSheetConnected(true);
    } catch (err) {
      console.error(err);
      setSheetConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const rawPostToSheet = async (payload) => {
    if (!sheetUrl) return false;
    try {
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const postToSheet = async (payload) => {
    const success = await rawPostToSheet(payload);
    if (success) {
      setTimeout(() => syncWithSheet(), 1000);
    }
    return success;
  };

  // --- USER AUTHENTICATION ---
  /**
   * handleLoginSubmit — Xác thực mật khẩu qua Google Sheets.
   * Lần đầu đăng nhập: auto pass và lưu mật khẩu vào sheet.
   * Lần sau: kiểm tra mật khẩu trước khi cho vào.
   * Trả về { success, isFirstTime, error } để LoginModal hiển thị lỗi nếu cần.
   */
  const handleLoginSubmit = async (values) => {
    const rawVal = (values.ma_user || '').trim().toUpperCase();
    const password = (values.password || '').trim();
    if (!rawVal || !password) return { success: false, error: 'Vui lòng điền đầy đủ thông tin!' };

    // ADMIN bypass — không cần kiểm tra mật khẩu qua sheet
    if (rawVal === 'ADMIN_WC') {
      setIsAdmin(true);
      setCurrentUserId('ADMIN_WC');
      setPlayers(prev => {
        if (!prev.some(p => p.id === 'ADMIN_WC')) {
          return [...prev, { id: 'ADMIN_WC', predictions: {}, ip: userIp, lastUpdated: new Date().toISOString() }];
        }
        return prev;
      });
      setShowLoginModal(false);
      return { success: true };
    }

    // Gọi back-end để kiểm tra / đăng ký tài khoản
    if (sheetUrl) {
      try {
        const response = await fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'checkAccount',
            ma_user: rawVal,
            password,
            ip: userIp,
            timestamp: new Date().toISOString()
          })
        });

        // no-cors => response.type === 'opaque', không đọc được body.
        // Dùng endpoint GET để lấy kết quả sau khi POST xong.
        // Delay nhỏ rồi gọi GET verify:
        await new Promise(r => setTimeout(r, 800));

        const verifyRes = await fetch(
          `${sheetUrl}?action=verifyAccount&ma_user=${encodeURIComponent(rawVal)}&password=${encodeURIComponent(password)}&t=${Date.now()}`
        );
        if (!verifyRes.ok) throw new Error('Lỗi kết nối server!');
        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          setIsAdmin(false);
          setCurrentUserId(rawVal);
          setPlayers(prev => {
            if (!prev.some(p => p.id === rawVal)) {
              return [...prev, { id: rawVal, predictions: {}, ip: userIp, lastUpdated: new Date().toISOString() }];
            }
            return prev;
          });
          setShowLoginModal(false);
          if (verifyData.isFirstTime) {
            alert(`🎉 Chào mừng ${rawVal}! Mật khẩu của bạn đã được lưu. Hãy nhớ cho lần sau!`);
          }
          return { success: true, isFirstTime: verifyData.isFirstTime };
        } else {
          return { success: false, error: verifyData.error || 'Mật khẩu không đúng. Vui lòng thử lại!' };
        }
      } catch (err) {
        console.error('Auth error:', err);
        // Fallback: nếu không kết nối được sheet, cho phép vào (offline mode)
        setIsAdmin(false);
        setCurrentUserId(rawVal);
        setPlayers(prev => {
          if (!prev.some(p => p.id === rawVal)) {
            return [...prev, { id: rawVal, predictions: {}, ip: userIp, lastUpdated: new Date().toISOString() }];
          }
          return prev;
        });
        setShowLoginModal(false);
        alert('⚠️ Không thể kết nối server để xác thực. Đăng nhập ở chế độ offline.');
        return { success: true };
      }
    } else {
      // Không có sheet URL — đăng nhập offline không xác thực mật khẩu
      setIsAdmin(false);
      setCurrentUserId(rawVal);
      setPlayers(prev => {
        if (!prev.some(p => p.id === rawVal)) {
          return [...prev, { id: rawVal, predictions: {}, ip: userIp, lastUpdated: new Date().toISOString() }];
        }
        return prev;
      });
      setShowLoginModal(false);
      return { success: true };
    }
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setIsAdmin(false);
    setShowLoginModal(true);
  };

  const checkAndUnfollowLeader = (onConfirm, actionName = 'thay đổi dự đoán') => {
    const activePlayer = players.find(p => p.id === currentUserId);
    const following = activePlayer?.predictions?.following;
    if (following) {
      Modal.confirm({
        title: (
          <span style={{ color: '#ff4d4f', fontWeight: 700 }}>
            Hủy theo dõi Minh Chủ?
          </span>
        ),
        content: (
          <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>
            Bạn đang theo dõi Minh chủ <span style={{ color: '#ffd700', fontWeight: 700 }}>{following}</span>.<br />
            Nếu tự ý {actionName}, bạn sẽ <b>tự động hủy theo dõi</b> Minh chủ này và <b>lưu dự đoán mới</b>.<br /><br />
            Bạn có đồng ý không?
          </div>
        ),
        okText: 'Đồng ý & Lưu',
        cancelText: 'Hủy',
        okButtonProps: {
          style: {
            background: 'linear-gradient(135deg, #ff4d4f, #d32f2f)',
            borderColor: '#ff4d4f',
            color: '#fff',
            fontWeight: 700,
          },
        },
        centered: true,
        onOk: async () => {
          await onConfirm();
        }
      });
      return true;
    }
    return false;
  };

  const handlePredict = (matchId, choice) => {
    if (!currentUserId) {
      setShowLoginModal(true);
      return;
    }

    const activePlayer = players.find(p => p.id === currentUserId);
    const following = activePlayer?.predictions?.following;

    const performPredict = async (shouldUnfollow = false) => {
      let finalPredictions = {};

      const updatedPlayers = players.map(p => {
        if (p.id === currentUserId) {
          const preds = {
            ...p.predictions,
            [matchId]: p.predictions[matchId] === choice ? null : choice
          };
          if (shouldUnfollow) {
            delete preds.following;
          }
          finalPredictions = preds;
          return {
            ...p,
            predictions: preds,
            ip: userIp,
            lastUpdated: new Date().toISOString()
          };
        }
        return p;
      });

      setPlayers(updatedPlayers);

      if (shouldUnfollow) {
        setSaveLoading(true);
        const success = await rawPostToSheet({
          action: 'submitPrediction',
          ma_user: currentUserId,
          ip: userIp,
          predictions: finalPredictions,
          timestamp: new Date().toISOString()
        });
        setSaveLoading(false);

        if (success) {
          alert('Đã hủy theo dõi Minh Chủ và lưu dự đoán mới của bạn thành công!');
          syncWithSheet();
        } else {
          alert('Không thể lưu dự đoán lên Google Sheets. Vui lòng thử lại!');
        }
      } else {
        setHasDraftChanges(true);
      }
    };

    if (following) {
      checkAndUnfollowLeader(() => performPredict(true), 'thay đổi dự đoán');
    } else {
      performPredict(false);
    }
  };

  const handlePredictChamp = (teamCode, wager) => {
    if (!currentUserId) {
      setShowLoginModal(true);
      return;
    }

    const activePlayer = players.find(p => p.id === currentUserId);
    const following = activePlayer?.predictions?.following;

    const performPredictChamp = async (shouldUnfollow = false) => {
      let finalPredictions = {};

      const updatedPlayers = players.map(p => {
        if (p.id === currentUserId) {
          const preds = {
            ...p.predictions,
            [`CHAMP_${teamCode}`]: wager === 0 ? null : wager
          };
          if (shouldUnfollow) {
            delete preds.following;
          }
          finalPredictions = preds;
          return {
            ...p,
            predictions: preds,
            ip: userIp,
            lastUpdated: new Date().toISOString()
          };
        }
        return p;
      });

      setPlayers(updatedPlayers);

      if (shouldUnfollow) {
        setSaveLoading(true);
        const success = await rawPostToSheet({
          action: 'submitPrediction',
          ma_user: currentUserId,
          ip: userIp,
          predictions: finalPredictions,
          timestamp: new Date().toISOString()
        });
        setSaveLoading(false);

        if (success) {
          alert('Đã hủy theo dõi Minh Chủ và lưu dự đoán cược vô địch của bạn thành công!');
          syncWithSheet();
        } else {
          alert('Không thể lưu dự đoán lên Google Sheets. Vui lòng thử lại!');
        }
      } else {
        setHasDraftChanges(true);
      }
    };

    if (following) {
      checkAndUnfollowLeader(() => performPredictChamp(true), 'thay đổi dự đoán Vô Địch');
    } else {
      performPredictChamp(false);
    }
  };

  const handleSavePredictions = async () => {
    if (!currentUserId) return;
    const activePlayer = players.find(p => p.id === currentUserId);
    if (!activePlayer) return;

    setSaveLoading(true);
    let success = true;
    if (sheetUrl) {
      success = await rawPostToSheet({
        action: 'submitPrediction',
        ma_user: currentUserId,
        ip: userIp,
        predictions: activePlayer.predictions,
        timestamp: new Date().toISOString()
      });

      if (success) {
        // Find followers
        const followers = players.filter(p => p.predictions?.following === currentUserId);
        if (followers.length > 0) {
          for (const follower of followers) {
            const updatedFollowerPreds = { ...follower.predictions };
            
            // Align match predictions
            matches.forEach(match => {
              let locked = lockedMatches[match.id] !== undefined 
                ? lockedMatches[match.id] 
                : new Date() > new Date(match.date);

              if (!locked) {
                const leaderPred = activePlayer.predictions[match.id];
                if (leaderPred !== undefined) {
                  updatedFollowerPreds[match.id] = leaderPred;
                } else {
                  delete updatedFollowerPreds[match.id];
                }
              }
            });

            // Align champion predictions
            let champLocked = lockedMatches['CONFIG_LOCK_CHAMPION'];
            if (champLocked === undefined) {
              champLocked = new Date() > new Date('2026-06-12T02:00:00');
            }
            if (!champLocked) {
              CHAMPION_OPTIONS.forEach(opt => {
                const key = `CHAMP_${opt.code}`;
                const leaderPred = activePlayer.predictions[key];
                if (leaderPred !== undefined) {
                  updatedFollowerPreds[key] = leaderPred;
                } else {
                  delete updatedFollowerPreds[key];
                }
              });
            }

            // Post for follower
            await rawPostToSheet({
              action: 'submitPrediction',
              ma_user: follower.id,
              ip: 'System-Sync',
              predictions: updatedFollowerPreds,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Wait 1 second and sync to update local states
        setTimeout(() => syncWithSheet(), 1000);
      }
    }

    setSaveLoading(false);
    if (success) {
      setHasDraftChanges(false);
      alert('Đã gửi tất cả dự đoán của bạn (và cập nhật cho người theo dõi) lên Google Sheets thành công!');
    } else {
      alert('Lỗi gửi dự đoán lên Google Sheets. Vui lòng kiểm tra lại kết nối!');
    }
  };

  const handleSetResult = async (matchId, actionType, extraData = null) => {
    if (!isAdmin) return;

    let updatedMatches = [...matches];

    if (actionType === 'editTeams' && extraData) {
      updatedMatches = matches.map(m => {
        if (m.id === matchId) {
          const u = { ...m, ...extraData };
          if (extraData.teamAName && TEAMS[extraData.teamAName.toUpperCase()]) {
            u.teamA = extraData.teamAName.toUpperCase();
          }
          if (extraData.teamBName && TEAMS[extraData.teamBName.toUpperCase()]) {
            u.teamB = extraData.teamBName.toUpperCase();
          }
          return u;
        }
        return m;
      });
      setMatches(updatedMatches);
    } else {
      updatedMatches = matches.map(m => {
        if (m.id === matchId) return { ...m, result: actionType };
        return m;
      });
      setMatches(updatedMatches);
    }

    if (sheetUrl) {
      const results = {};
      const koTeams = {};
      updatedMatches.forEach(m => {
        if (m.result !== null) results[m.id] = m.result;
        if (m.stage !== 'group') {
          koTeams[m.id] = {
            teamAName: m.teamAName,
            teamBName: m.teamBName,
            teamA: m.teamA,
            teamB: m.teamB
          };
        }
      });

      await postToSheet({
        action: 'updateResults',
        matchesResults: results,
        knockoutTeams: koTeams
      });
    }
  };

  const handleLockAllStageMatches = async (stage, shouldLock) => {
    const updatedLocks = { ...lockedMatches };

    if (stage === 'CONFIG_LOCK_CHAMPION') {
      updatedLocks['CONFIG_LOCK_CHAMPION'] = shouldLock;
    } else {
      const matchesInStage = matches.filter(m => {
        if (stage === 'finals') return m.stage === 'final' || m.stage === 'third_place';
        return m.stage === stage;
      });
      matchesInStage.forEach(m => {
        updatedLocks[m.id] = shouldLock;
      });
    }

    setLockedMatches(updatedLocks);

    if (sheetUrl) {
      await postToSheet({
        action: 'updateLocks',
        lockedMatches: updatedLocks
      });
    }
  };

  const handleUpdatePenaltiesConfig = async (newConfig) => {
    if (!isAdmin) return;
    setPenaltiesConfig(newConfig);

    const updatedLocks = {
      ...lockedMatches,
      'CONFIG_PENALTY_group': newConfig.group,
      'CONFIG_PENALTY_r32': newConfig.r32,
      'CONFIG_PENALTY_r16': newConfig.r16,
      'CONFIG_PENALTY_qf': newConfig.qf,
      'CONFIG_PENALTY_sf': newConfig.sf,
      'CONFIG_PENALTY_third_place': newConfig.third_place,
      'CONFIG_PENALTY_final': newConfig.final
    };

    setLockedMatches(updatedLocks);

    if (sheetUrl) {
      await postToSheet({
        action: 'updateLocks',
        lockedMatches: updatedLocks
      });
    } else {
      alert('Đã lưu cấu hình điểm phạt thành công vào Local Storage!');
    }
  };

  const handleSimulateResults = async () => {
    const choices = ['A', 'D', 'B'];
    const updatedMatches = matches.map(m => ({
      ...m,
      result: choices[Math.floor(Math.random() * choices.length)]
    }));

    setMatches(updatedMatches);

    if (sheetUrl) {
      const results = {};
      updatedMatches.forEach(m => {
        results[m.id] = m.result;
      });
      await postToSheet({
        action: 'updateResults',
        matchesResults: results
      });
    }
  };

  const handleResetResults = async () => {
    const updatedMatches = matches.map(m => ({ ...m, result: null }));
    setMatches(updatedMatches);

    if (sheetUrl) {
      await postToSheet({
        action: 'updateResults',
        matchesResults: {}
      });
    }
  };

  const handleImportPlayer = async (playerData) => {
    const updatedPlayers = [
      ...players.filter(p => p.id !== playerData.id),
      {
        ...playerData,
        ip: playerData.ip || 'Imported',
        lastUpdated: playerData.lastUpdated || new Date().toISOString()
      }
    ];

    setPlayers(updatedPlayers);

    if (sheetUrl) {
      await postToSheet({
        action: 'submitPrediction',
        ma_user: playerData.id,
        ip: playerData.ip || 'Imported',
        predictions: playerData.predictions,
        timestamp: playerData.lastUpdated || new Date().toISOString()
      });
    }
  };

  const handleExportAllData = () => {
    const results = {};
    matches.forEach(m => {
      if (m.result !== null) results[m.id] = m.result;
    });

    return JSON.stringify({
      players,
      matchesResults: results,
      lockedMatches
    }, null, 2);
  };

  const getFilteredMatches = () => {
    let filtered = matches;

    if (activeTab === 'group') {
      filtered = filtered.filter(m => m.stage === 'group');
      if (groupFilter !== 'ALL') {
        filtered = filtered.filter(m => m.group === groupFilter);
      }
      if (matchdayFilter !== 'ALL') {
        filtered = filtered.filter(m => m.matchday === parseInt(matchdayFilter));
      }
    } else if (activeTab === 'r32') {
      filtered = filtered.filter(m => m.stage === 'r32');
    } else if (activeTab === 'r16') {
      filtered = filtered.filter(m => m.stage === 'r16');
    } else if (activeTab === 'qf') {
      filtered = filtered.filter(m => m.stage === 'qf');
    } else if (activeTab === 'sf') {
      filtered = filtered.filter(m => m.stage === 'sf');
    } else if (activeTab === 'finals') {
      filtered = filtered.filter(m => m.stage === 'final' || m.stage === 'third_place');
    }

    return filtered;
  };

  const filteredMatches = getFilteredMatches();
  const currentPlayer = players.find(p => p.id === currentUserId);
  const currentPredictions = currentPlayer ? currentPlayer.predictions : {};

  const isMatchLocked = (match) => {
    if (lockedMatches[match.id] !== undefined) {
      return lockedMatches[match.id];
    }
    return new Date() > new Date(match.date);
  };

  const isChampionLocked = () => {
    if (lockedMatches['CONFIG_LOCK_CHAMPION'] !== undefined) {
      return lockedMatches['CONFIG_LOCK_CHAMPION'];
    }
    return new Date() > new Date('2026-06-12T02:00:00');
  };

  /**
   * handleCopyPredictions — Copy dự đoán của người khác sang currentUser.
   * Chỉ copy những trận CHƯA bị khóa (chưa diễn ra).
   * Trận đã diễn ra giữ nguyên dự đoán cũ của currentUser.
   */
  const handleCopyPredictions = (targetPlayerId) => {
    if (!currentUserId || currentUserId === targetPlayerId) return;

    const targetPlayer = players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return;

    const activePlayer = players.find(p => p.id === currentUserId);
    const following = activePlayer?.predictions?.following;

    const performCopy = async (shouldUnfollow = false) => {
      let finalPredictions = {};

      const updatedPlayers = players.map(p => {
        if (p.id !== currentUserId) return p;

        const newPredictions = { ...p.predictions };
        if (shouldUnfollow) {
          delete newPredictions.following;
        }

        matches.forEach(match => {
          let locked = lockedMatches[match.id] !== undefined 
            ? lockedMatches[match.id] 
            : new Date() > new Date(match.date);

          if (!locked) {
            const targetPred = targetPlayer.predictions[match.id];
            if (targetPred) {
              newPredictions[match.id] = targetPred;
            }
          }
        });

        finalPredictions = newPredictions;
        return {
          ...p,
          predictions: newPredictions,
          lastUpdated: new Date().toISOString(),
        };
      });

      setPlayers(updatedPlayers);

      if (shouldUnfollow) {
        setSaveLoading(true);
        const success = await rawPostToSheet({
          action: 'submitPrediction',
          ma_user: currentUserId,
          ip: userIp,
          predictions: finalPredictions,
          timestamp: new Date().toISOString()
        });
        setSaveLoading(false);

        if (success) {
          alert('Đã hủy theo dõi Minh Chủ cũ, copy và lưu dự đoán mới của bạn thành công!');
          syncWithSheet();
        } else {
          alert('Không thể lưu dự đoán lên Google Sheets. Vui lòng thử lại!');
        }
      } else {
        setHasDraftChanges(true);
      }
    };

    if (following) {
      Modal.confirm({
        title: (
          <span style={{ color: '#ff4d4f', fontWeight: 700 }}>
            Hủy theo dõi Minh Chủ?
          </span>
        ),
        content: (
          <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>
            Bạn đang theo dõi Minh chủ <span style={{ color: '#ffd700', fontWeight: 700 }}>{following}</span>.<br />
            Nếu copy dự đoán từ <span style={{ color: '#38bdf8', fontWeight: 700 }}>{targetPlayerId}</span>, bạn sẽ <b>tự động hủy theo dõi</b> Minh chủ cũ và <b>lưu dự đoán mới</b>.<br /><br />
            Bạn có đồng ý không?
          </div>
        ),
        okText: 'Đồng ý & Copy',
        cancelText: 'Hủy',
        okButtonProps: {
          style: {
            background: 'linear-gradient(135deg, #ff4d4f, #d32f2f)',
            borderColor: '#ff4d4f',
            color: '#fff',
            fontWeight: 700,
          },
        },
        centered: true,
        onOk: () => {
          performCopy(true);
        }
      });
    } else {
      performCopy(false);
    }
  };

  const handleFollowLeader = async (targetLeaderId) => {
    if (!currentUserId || currentUserId === targetLeaderId) return;

    const leader = players.find(p => p.id === targetLeaderId);
    if (!leader) return;

    const activePlayer = players.find(p => p.id === currentUserId);
    if (!activePlayer) return;

    const newPredictions = { ...activePlayer.predictions };
    newPredictions.following = targetLeaderId;

    // Copy unlocked matches
    matches.forEach(match => {
      let locked = lockedMatches[match.id] !== undefined 
        ? lockedMatches[match.id] 
        : new Date() > new Date(match.date);

      if (!locked) {
        const leaderPred = leader.predictions[match.id];
        if (leaderPred !== undefined) {
          newPredictions[match.id] = leaderPred;
        } else {
          delete newPredictions[match.id];
        }
      }
    });

    // Copy champion predictions if not locked
    let champLocked = lockedMatches['CONFIG_LOCK_CHAMPION'];
    if (champLocked === undefined) {
      champLocked = new Date() > new Date('2026-06-12T02:00:00');
    }
    if (!champLocked) {
      CHAMPION_OPTIONS.forEach(opt => {
        const key = `CHAMP_${opt.code}`;
        const leaderPred = leader.predictions[key];
        if (leaderPred !== undefined) {
          newPredictions[key] = leaderPred;
        } else {
          delete newPredictions[key];
        }
      });
    }

    // Update state
    const updatedPlayers = players.map(p => {
      if (p.id === currentUserId) {
        return {
          ...p,
          predictions: newPredictions,
          ip: userIp,
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    setHasDraftChanges(false);

    // Save immediately
    setSaveLoading(true);
    const success = await rawPostToSheet({
      action: 'submitPrediction',
      ma_user: currentUserId,
      ip: userIp,
      predictions: newPredictions,
      timestamp: new Date().toISOString()
    });
    setSaveLoading(false);

    if (success) {
      alert(`Đã chọn ${targetLeaderId} làm Minh Chủ và tự động đồng bộ tất cả dự đoán chưa đá thành công!`);
      syncWithSheet();
    } else {
      alert('Lỗi lưu cấu hình Minh Chủ lên Google Sheets. Vui lòng thử lại!');
    }
  };

  // Các tab antd
  const tabItems = [
    { key: 'group', label: 'Vòng Bảng' },
    { key: 'r32', label: 'Vòng 32 Đội' },
    { key: 'r16', label: 'Vòng 16 Đội' },
    { key: 'qf', label: 'Tứ Kết' },
    { key: 'sf', label: 'Bán Kết' },
    { key: 'finals', label: 'Chung Kết & Tranh Hạng 3' },
    // { key: 'champion', label: '🏆 Dự đoán Vô Địch' }
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.darkAlgorithm,
        token: {
          colorPrimary: '#ffd700',
          colorBgBase: '#060814',
          colorBgContainer: '#0d1329',
          borderRadius: 12,
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }
      }}
    >
      {/* 1. WELCOME ANIMATION OVERLAY */}
      {showWelcome && (
        <div className="welcome-overlay">
          <div className="welcome-content">
            <TrophyFilled className="welcome-cup animate-bounce" />
            <h1 className="welcome-title text-4xl md:text-6xl font-black">
              WORLD CUP 2026
            </h1>
            <p className="welcome-subtitle text-xs md:text-sm uppercase tracking-widest text-slate-400">
              ⚡ SIÊU DỰ ĐOÁN NHÓM BẠN • LOADING ⚡
            </p>
            <div className="soccer-loading mt-4">
              <div className="ball">⚽</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. IDENTIFICATION MODAL */}
      <LoginModal
        open={showLoginModal}
        onLoginSubmit={handleLoginSubmit}
        onViewAsGuest={() => {
          setCurrentUserId(null);
          setIsAdmin(false);
          setShowLoginModal(false);
        }}
      />

      {/* Main Layout */}
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        <Navbar
          currentUserId={currentUserId}
          onLogout={handleLogout}
          onOpenLoginModal={() => setShowLoginModal(true)}
          sheetConnected={sheetConnected}
          isAdmin={isAdmin}
        />

        <Content style={{ padding: '0 0 40px 0' }}>
          
          {/* 3. HERO BANNER IMAGE (Vua Tiên Tri) */}
          <div className="container mx-auto px-4 md:px-6 mt-6">
            <div 
              className="hero-banner-container"
              style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: 24,
                backgroundImage: 'url(/wc_banner.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: 220,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Overlay Gradient */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to right, rgba(6, 8, 20, 0.9) 20%, rgba(6, 8, 20, 0.4) 60%, rgba(6, 8, 20, 0.9) 100%)',
                  zIndex: 1
                }}
              />
              
              {/* Banner Text */}
              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 20px' }}>
                <span style={{ background: 'rgba(253, 224, 71, 0.15)', border: '1px solid rgba(253, 224, 71, 0.3)', color: '#ffd700', padding: '4px 14px', borderRadius: 20, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' }}>
                  🏆 SIÊU CÚP DỰ ĐOÁN WORLD CUP 2026 🏆
                </span>
                <Title level={1} style={{ color: '#fff', fontSize: '32px', fontWeight: 950, margin: '10px 0 6px 0', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  ĐI TÌM <span style={{ background: 'linear-gradient(to right, #ffe066, #00f5a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VUA TIÊN TRI</span> WC
                </Title>
                <Paragraph style={{ color: '#94a3b8', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.5 }}>
                  Trở thành GOAT tiên tri để có 1 chuyến đi chơi miễn phí!
                </Paragraph>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 md:px-6 flex flex-col gap-6">
            
            {/* Sync Status / Manual Button */}
            {sheetUrl && (
              <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-xs text-slate-400 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${sheetConnected ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                  {sheetConnected 
                    ? 'Đồng bộ hóa trực tuyến qua Google Sheets.' 
                    : 'Không thể kết nối Sheets. Dữ liệu đang được lưu tạm cục bộ.'}
                </span>
                <Button
                  size="small"
                  type="text"
                  onClick={() => syncWithSheet().then(() => alert('Dữ liệu đã được cập nhật mới nhất!'))}
                  icon={<SyncOutlined spin={loading} />}
                  style={{ color: '#ffd700', fontSize: 11 }}
                >
                  Làm mới
                </Button>
              </div>
            )}

            {/* Dashboard Grid Layout */}
            <Row gutter={[24, 24]}>
              
              {/* Leaderboard & Admin Column */}
              <Col xs={24} lg={10} className="flex flex-col gap-6">
                <Leaderboard
                  players={players}
                  matches={matches}
                  currentUserId={currentUserId}
                  penaltiesConfig={penaltiesConfig}
                  lockedMatches={lockedMatches}
                  onCopyPredictions={handleCopyPredictions}
                  onFollowLeader={handleFollowLeader}
                />

                {isAdmin && (
                  <AdminPanel
                    sheetUrl={sheetUrl}
                    onSaveSheetUrl={setSheetUrl}
                    onSyncWithSheet={syncWithSheet}
                    onSimulateResults={handleSimulateResults}
                    onResetResults={handleResetResults}
                    onImportPlayer={handleImportPlayer}
                    onExportAllData={handleExportAllData}
                    onLockAllStageMatches={handleLockAllStageMatches}
                    currentStage={activeTab}
                    penaltiesConfig={penaltiesConfig}
                    onUpdatePenaltiesConfig={handleUpdatePenaltiesConfig}
                  />
                )}
              </Col>

              {/* Match predictions list column */}
              <Col xs={24} lg={14} className="flex flex-col gap-4">
                
                {/* Ant Design Tabs for rounds */}
                <div style={{ background: 'rgba(15, 23, 42, 0.45)', padding: '6px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    style={{ margin: 0 }}
                  />
                </div>

                {/* Vòng bảng Filters */}
                {activeTab === 'group' && (
                  <div style={{ background: 'rgba(15, 23, 42, 0.45)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Nested Tabs for Matchdays */}
                    <Tabs
                      activeKey={matchdayFilter}
                      onChange={setMatchdayFilter}
                      size="small"
                      type="card"
                      items={[
                        { key: 'ALL', label: 'Tất cả các lượt' },
                        { key: '1', label: 'Lượt trận 1' },
                        { key: '2', label: 'Lượt trận 2' },
                        { key: '3', label: 'Lượt trận 3' }
                      ]}
                      style={{ marginBottom: 0 }}
                      className="wc-nested-tabs"
                    />
                    
                    {/* Filter for Groups */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                      <Space>
                        <Text style={{ fontSize: 11, color: '#64748b', fontWeight: 'bold' }}>BẢNG ĐẤU:</Text>
                        <Select
                          value={groupFilter}
                          onChange={setGroupFilter}
                          style={{ width: 140 }}
                          size="small"
                          options={[
                            { value: 'ALL', label: 'Tất cả các bảng' },
                            ...Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i)).map(g => ({
                              value: g,
                              label: `Bảng ${g}`
                            }))
                          ]}
                        />
                      </Space>
                      
                      {groupFilter !== 'ALL' && (
                        <Tag color="gold" style={{ margin: 0, fontSize: 10, fontWeight: 'bold' }}>
                          Đang xem Bảng {groupFilter}
                        </Tag>
                      )}
                    </div>
                  </div>
                )}

                {/* Match Cards Render Grid / Champion Panel */}
                {activeTab === 'champion' ? (
                  <ChampionPanel
                    predictions={currentPredictions}
                    onPredictChamp={handlePredictChamp}
                    isLocked={isChampionLocked()}
                    currentUserId={currentUserId}
                    onOpenLoginModal={() => setShowLoginModal(true)}
                  />
                ) : (
                  <div>
                    <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
                      <Text strong style={{ color: '#64748b', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        DANH SÁCH CÁC TRẬN ĐẤU ({filteredMatches.length})
                      </Text>
                      
                      <div className="flex items-center flex-wrap gap-2">
                        {activeTab === 'finals' ? (
                          <Tag color="error" style={{ fontSize: 10, margin: 0, fontWeight: 'bold' }}>
                            💥 Phạt đoán sai: Chung kết {penaltiesConfig.final}đ | Hạng 3 {penaltiesConfig.third_place}đ
                          </Tag>
                        ) : (
                          <Tag color="error" style={{ fontSize: 10, margin: 0, fontWeight: 'bold' }}>
                            💥 Phạt đoán sai: {penaltiesConfig[activeTab]}đ
                          </Tag>
                        )}

                        {!currentUserId && (
                          <Tag color="warning" style={{ fontSize: 10, margin: 0 }}>
                            ⚠️ Hãy nhập Mã User để mở khóa dự đoán
                          </Tag>
                        )}
                      </div>
                    </div>

                    {filteredMatches.length === 0 ? (
                      <div style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 14, padding: 40, textAlign: 'center' }}>
                        <Text style={{ color: '#64748b' }}>Không tìm thấy trận đấu nào thỏa mãn bộ lọc.</Text>
                      </div>
                    ) : (
                      <div className="matches-grid">
                        {filteredMatches.map(match => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            prediction={currentPredictions[match.id] || null}
                            onPredict={handlePredict}
                            isAdmin={isAdmin}
                            onSetResult={handleSetResult}
                            isLocked={isMatchLocked(match)}
                            penaltiesConfig={penaltiesConfig}
                            players={players}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </Col>

            </Row>

          </div>
        </Content>
      </Layout>

      {/* Floating Save predictions bar */}
      {currentUserId && currentUserId !== 'ADMIN_WC' && (
        <div 
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            background: 'rgba(13, 19, 41, 0.95)',
            border: hasDraftChanges ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '12px 24px',
            boxShadow: hasDraftChanges ? '0 0 25px rgba(253, 224, 71, 0.25)' : '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            width: '90%',
            maxWidth: 450
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              Tài khoản: <span style={{ color: '#ffd700' }}>{currentUserId}</span>
            </span>
            <span style={{ fontSize: '11px', color: '#cbd5e1', marginTop: 2 }}>
              {hasDraftChanges ? (
                <span style={{ color: '#faad14', fontWeight: 'bold' }}>● Có thay đổi chưa lưu</span>
              ) : (
                <span style={{ color: '#52c41a' }}>✓ Dự đoán đã đồng bộ</span>
              )}
            </span>
          </div>
          <Button
            type="primary"
            loading={saveLoading}
            onClick={handleSavePredictions}
            style={{
              background: hasDraftChanges ? 'linear-gradient(135deg, #ffd700 0%, #d97706 100%)' : 'rgba(255,255,255,0.05)',
              borderColor: hasDraftChanges ? '#ffd700' : 'rgba(255,255,255,0.1)',
              color: hasDraftChanges ? '#0f172a' : '#94a3b8',
              fontWeight: 'bold',
              height: 34,
              borderRadius: 8
            }}
          >
            {hasDraftChanges ? 'GỬI DỰ ĐOÁN' : 'ĐÃ LƯU'}
          </Button>
        </div>
      )}
    </ConfigProvider>
  );
}
