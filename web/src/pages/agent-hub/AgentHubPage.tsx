import { useCallback, useEffect, useRef, useState } from 'react';
import { aiAgentApi } from '../../api/ai-agent.api';

type PlatformUser = { id: string; email: string; username: string; is_active: boolean };
type PlatformProject = { id: string; name: string; description: string | null; user_id: string; created_at: string };
type Agent = { id: string; name: string; description: string | null; is_active: boolean; project_id: string; last_connected_at: string | null };
type Room = { id: string; name: string; project_id: string; is_active: boolean; created_at: string };
type Message = { id: string; room_id: string; sender_name: string; msg_type: string; content: string; timestamp: string };
type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type AgentToken = { agent_token: string; agent_id: string; agent_name: string; ws_url: string; expires_in_minutes: number };

const MSG_TYPE_COLORS: Record<string, string> = {
  question: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  answer: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  command: 'bg-purple-50 border-purple-200 text-purple-800',
  event: 'bg-orange-50 border-orange-200 text-orange-800',
};

const STORAGE_KEY = 'ai_hub_session';

const AgentHubPage = () => {
  const [tab, setTab] = useState<'rooms' | 'agents' | 'projects'>('rooms');
  const [platformToken, setPlatformToken] = useState('');
  const [agentToken, setAgentToken] = useState('');
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
  const [projects, setProjects] = useState<PlatformProject[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [msgType, setMsgType] = useState<'info' | 'question' | 'answer' | 'command' | 'event'>('info');
  const [onlineAgents, setOnlineAgents] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [wsStatus, setWsStatus] = useState<WsStatus>('disconnected');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showConnectAgent, setShowConnectAgent] = useState(false);
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', username: '', password: '' });
  const [connectForm, setConnectForm] = useState({ agent_name: '', project_id: '', description: '', expires_in_minutes: '480' });
  const [roomForm, setRoomForm] = useState({ name: '', project_id: '' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [connectedAgentInfo, setConnectedAgentInfo] = useState<AgentToken | null>(null);
  const [showPasteToken, setShowPasteToken] = useState(false);
  const [pasteTokenInput, setPasteTokenInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsRoomRef = useRef<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session.platformToken) setPlatformToken(session.platformToken);
        if (session.agentToken) setAgentToken(session.agentToken);
        if (session.connectedAgentInfo) setConnectedAgentInfo(session.connectedAgentInfo);
      }
    } catch {}
  }, []);

  // Save session to localStorage whenever tokens change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ platformToken, agentToken, connectedAgentInfo }));
  }, [platformToken, agentToken, connectedAgentInfo]);

  // Load initial data when platformToken is available
  useEffect(() => {
    if (!platformToken) return;
    loadAll();
  }, [platformToken]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Native WebSocket for real-time messages — URL uses room NAME per platform docs
  const connectWs = useCallback((roomName: string, aToken: string) => {
    if (wsRef.current && wsRoomRef.current === roomName) return;
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    wsRoomRef.current = roomName;
    setWsStatus('connecting');
    const ws = new WebSocket(`ws://64.118.157.17/ws/${roomName}?token=${aToken}`);
    wsRef.current = ws;
    ws.onopen = () => setWsStatus('connected');
    ws.onclose = () => { setWsStatus('disconnected'); wsRoomRef.current = null; };
    ws.onerror = () => setWsStatus('error');
    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        // Platform WS format: {id, from, type, content, room, timestamp}
        if (!raw.content && !raw.from) return; // skip server ACKs with no content
        const normalized: Message = {
          id: raw.id || String(Date.now() + Math.random()),
          room_id: raw.room || raw.room_id || roomName,
          sender_name: raw.from || raw.sender_name || 'unknown',
          msg_type: raw.type || raw.msg_type || 'info',
          content: typeof raw.content === 'object' ? JSON.stringify(raw.content) : String(raw.content ?? ''),
          timestamp: raw.timestamp || new Date().toISOString(),
        };
        if (!normalized.content.trim()) return; // skip empty content
        setMessages((prev) => {
          if (prev.some((m) => m.id === normalized.id)) return prev;
          return [...prev, normalized];
        });
      } catch {}
    };
  }, []);

  // Connect WS when room + agent token are both available — use room NAME
  useEffect(() => {
    const aToken = agentToken || connectedAgentInfo?.agent_token;
    if (selectedRoom && aToken) {
      connectWs(selectedRoom.name, aToken);
    } else {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      setWsStatus('disconnected');
    }
    return () => {};
  }, [selectedRoom, agentToken, connectedAgentInfo, connectWs]);

  // Cleanup WS on unmount
  useEffect(() => {
    return () => { if (wsRef.current) { wsRef.current.close(); } };
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [userRes, projectsRes, agentsRes, roomsRes] = await Promise.allSettled([
        aiAgentApi.getMe(platformToken),
        aiAgentApi.listProjects(platformToken),
        aiAgentApi.listAgents(platformToken),
        aiAgentApi.listRooms(platformToken),
      ]);
      if (userRes.status === 'fulfilled') setPlatformUser(userRes.value.data);
      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.data || []);
      if (agentsRes.status === 'fulfilled') setAgents(agentsRes.value.data || []);
      if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value.data || []);
      // Online agents
      try {
        const onlineRes = await aiAgentApi.onlineAgents(platformToken);
        setOnlineAgents(onlineRes.data || {});
      } catch {}
    } catch (err: any) {
      setError('Failed to load platform data. Check your token.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string, showSpinner = true) => {
    const aToken = agentToken || connectedAgentInfo?.agent_token;
    if (!aToken && !platformToken) return;
    const token = aToken || platformToken;
    if (showSpinner) setMsgLoading(true);
    try {
      const res = await aiAgentApi.getMessages(token, roomId);
      // REST returns newest-first — reverse to show oldest at top
      setMessages([...(res.data || [])].reverse());
    } catch {
      if (showSpinner) setError('Failed to load messages');
    } finally {
      if (showSpinner) setMsgLoading(false);
    }
  };

  const selectRoom = (room: Room) => {
    setMessages([]);
    setSelectedRoom(room);
    loadMessages(room.id);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const res = await aiAgentApi.platformLogin(loginForm.email, loginForm.password);
      const token = res.data?.access_token;
      if (token) {
        setPlatformToken(token);
        setShowLogin(false);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Login failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const res = await aiAgentApi.platformRegister(registerForm.email, registerForm.username, registerForm.password);
      const token = res.data?.access_token;
      if (token) {
        setPlatformToken(token);
        setShowRegister(false);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConnectAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const res = await aiAgentApi.connectAgent(
        platformToken,
        connectForm.agent_name,
        connectForm.project_id,
        connectForm.description || undefined,
        connectForm.expires_in_minutes ? Number(connectForm.expires_in_minutes) : undefined,
      );
      const info: AgentToken = res.data;
      setAgentToken(info.agent_token);
      setConnectedAgentInfo(info);
      setShowConnectAgent(false);
      await loadAll();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to connect agent');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const res = await aiAgentApi.createRoom(platformToken, roomForm.name, roomForm.project_id);
      setRooms((prev) => [...prev, res.data]);
      setShowNewRoom(false);
      setRoomForm({ name: '', project_id: '' });
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to create room');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const res = await aiAgentApi.createProject(platformToken, projectForm.name, projectForm.description || undefined);
      setProjects((prev) => [...prev, res.data]);
      setShowNewProject(false);
      setProjectForm({ name: '', description: '' });
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to create project');
    } finally {
      setFormLoading(false);
    }
  };

  const [broadcasting, setBroadcasting] = useState(false);

  const handleBroadcast = async (eventType: string, label: string) => {
    const aToken = agentToken || connectedAgentInfo?.agent_token;
    if (!aToken || !selectedRoom) { setError('Connect an agent and select a room first.'); return; }
    setBroadcasting(true);
    try {
      const exampleData: Record<string, Record<string, any>> = {
        project_summary: { total_tasks: 24, completed: 17, in_progress: 5, pending: 2, budget_used_pct: 68, active_members: 8, overdue_tasks: 1 },
        task_update: { task: 'Install electrical wiring', status: 'completed', assignee: 'John M.', priority: 'high', project: 'Site A Renovation', completion_pct: 100 },
        milestone_reached: { milestone: 'Foundation Complete', completion_pct: 100, deadline: '2026-04-01', days_ahead: 2, budget_impact: 'on-budget' },
        expense_approved: { description: 'Scaffolding rental', amount: 4500, currency: 'USD', category: 'Equipment', approved_by: 'PM Admin', project: 'Site A Renovation' },
        low_stock_alert: { item: 'Portland Cement (50kg)', current_stock: 12, threshold: 20, unit: 'bags', project: 'Site A Renovation', reorder_suggested: 50 },
      };
      await aiAgentApi.broadcastEvent(aToken, selectedRoom.name, eventType, 'Site A Renovation', exampleData[eventType] || {}, 'WINDSURF');
    } catch {
      setError(`Failed to broadcast ${label}`);
    } finally {
      setBroadcasting(false);
    }
  };

  const handleSendMessage = async (_e: React.FormEvent) => {
    if (!msgInput.trim() || !selectedRoom) return;
    const activeAgentToken = agentToken || connectedAgentInfo?.agent_token;
    if (!activeAgentToken) { setError('No agent token. Connect an agent first.'); return; }
    setSending(true);
    try {
      // Send via REST using room NAME (platform docs: room = name or id)
      const res = await aiAgentApi.sendMessage(activeAgentToken, selectedRoom.name, msgInput.trim(), msgType);
      // WS will echo it back — but add optimistically if WS is offline
      if (wsStatus !== 'connected') {
        setMessages((prev) => [...prev, {
          id: res.data.id,
          room_id: res.data.room_id || selectedRoom.id,
          sender_name: res.data.sender_name || connectedAgentInfo?.agent_name || 'me',
          msg_type: res.data.msg_type || msgType,
          content: msgInput.trim(),
          timestamp: res.data.timestamp || new Date().toISOString(),
        }]);
      }
      setMsgInput('');
    } catch {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleRevokeAgent = async (agentId: string) => {
    if (!confirm('Revoke this agent?')) return;
    await aiAgentApi.revokeAgent(platformToken, agentId);
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (ts: string) => new Date(ts).toLocaleDateString();

  const activeAgentToken = agentToken || connectedAgentInfo?.agent_token;
  const isConnected = !!platformToken && !!platformUser;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* LEFT SIDEBAR */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-gray-900 text-sm">🤖 Agent Hub</h1>
              <p className="text-xs text-gray-500 mt-0.5">AI Collaboration Platform</p>
            </div>
            {isConnected && (
              <button onClick={loadAll} className="text-xs text-blue-600 hover:underline">Refresh</button>
            )}
          </div>

          {/* Platform connection status */}
          <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${isConnected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            {isConnected ? `${platformUser?.username}` : 'Not connected'}
          </div>

          {/* Agent token status */}
          {activeAgentToken && (
            <div className="mt-2 px-3 py-2 rounded-lg text-xs bg-purple-50 text-purple-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Agent: <span className="font-semibold">{connectedAgentInfo?.agent_name || 'TOKEN SET'}</span>
              <button onClick={() => { setAgentToken(''); setConnectedAgentInfo(null); }} className="ml-auto text-purple-400 hover:text-red-500 text-base leading-none">&times;</button>
            </div>
          )}

          {/* Quick paste agent token */}
          {!activeAgentToken && isConnected && (
            <div className="mt-2">
              {!showPasteToken ? (
                <button onClick={() => setShowPasteToken(true)}
                  className="w-full py-1.5 text-xs text-purple-600 border border-dashed border-purple-300 rounded-lg hover:bg-purple-50">
                  + Paste Agent Token
                </button>
              ) : (
                <div className="space-y-1.5">
                  <textarea
                    value={pasteTokenInput}
                    onChange={(e) => setPasteTokenInput(e.target.value)}
                    placeholder="Paste agent JWT token here..."
                    rows={3}
                    className="w-full px-2 py-1.5 text-[10px] font-mono border border-purple-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                  />
                  <div className="flex gap-1.5">
                    <button onClick={() => {
                      if (pasteTokenInput.trim()) {
                        setAgentToken(pasteTokenInput.trim());
                        setPasteTokenInput('');
                        setShowPasteToken(false);
                      }
                    }} className="flex-1 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      Use Token
                    </button>
                    <button onClick={() => { setShowPasteToken(false); setPasteTokenInput(''); }}
                      className="flex-1 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isConnected && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => { setShowLogin(true); setFormError(''); }}
                className="flex-1 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Login
              </button>
              <button onClick={() => { setShowRegister(true); setFormError(''); }}
                className="flex-1 py-2 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Register
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        {isConnected && (
          <div className="flex border-b border-gray-100">
            {(['rooms', 'agents', 'projects'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {isConnected && (
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {loading && <div className="text-center py-8 text-xs text-gray-400">Loading...</div>}

            {/* ROOMS TAB */}
            {tab === 'rooms' && !loading && (
              <>
                <button onClick={() => { setShowNewRoom(true); setFormError(''); setRoomForm({ name: '', project_id: projects[0]?.id || '' }); }}
                  className="w-full text-left px-3 py-2 text-xs text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 font-medium">
                  + New Room
                </button>
                {rooms.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No rooms yet</p>}
                {rooms.map((room) => (
                  <button key={room.id} onClick={() => selectRoom(room)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${selectedRoom?.id === room.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-800 truncate">💬 {room.name}</span>
                      {!room.is_active && <span className="text-[10px] text-gray-400">inactive</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{room.id}</p>
                  </button>
                ))}
              </>
            )}

            {/* AGENTS TAB */}
            {tab === 'agents' && !loading && (
              <>
                <button onClick={() => { setShowConnectAgent(true); setFormError(''); setConnectForm({ agent_name: 'PROJECT-MILESTONE', project_id: projects[0]?.id || '', description: 'Project Milestone App Agent', expires_in_minutes: '480' }); }}
                  className="w-full text-left px-3 py-2 text-xs text-purple-600 border border-dashed border-purple-300 rounded-lg hover:bg-purple-50 font-medium">
                  + Connect Agent
                </button>
                {agents.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No agents yet</p>}
                {agents.map((agent) => (
                  <div key={agent.id} className="px-3 py-2.5 rounded-lg border border-gray-100 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-800 truncate">🤖 {agent.name}</span>
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${agent.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <button onClick={() => handleRevokeAgent(agent.id)} className="text-[10px] text-red-400 hover:text-red-600">×</button>
                      </div>
                    </div>
                    {agent.description && <p className="text-[10px] text-gray-400 mt-0.5">{agent.description}</p>}
                    {agent.last_connected_at && (
                      <p className="text-[10px] text-gray-400 mt-0.5">Last seen: {formatDate(agent.last_connected_at)}</p>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* PROJECTS TAB */}
            {tab === 'projects' && !loading && (
              <>
                <button onClick={() => { setShowNewProject(true); setFormError(''); }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-600 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                  + New Project
                </button>
                {projects.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No projects yet</p>}
                {projects.map((project) => (
                  <div key={project.id} className="px-3 py-2.5 rounded-lg border border-gray-100 bg-white">
                    <p className="text-xs font-medium text-gray-800">📁 {project.name}</p>
                    {project.description && <p className="text-[10px] text-gray-400 mt-0.5">{project.description}</p>}
                    <p className="text-[10px] text-gray-300 mt-0.5 font-mono">{project.id}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Online agents */}
        {isConnected && Object.keys(onlineAgents).length > 0 && (
          <div className="p-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Online Agents</p>
            {Object.entries(onlineAgents).map(([id, name]: any) => (
              <div key={id} className="flex items-center gap-1.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600">{name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Disconnect button */}
        {isConnected && (
          <div className="p-3 border-t border-gray-100">
            <button onClick={() => { setPlatformToken(''); setAgentToken(''); setPlatformUser(null); setConnectedAgentInfo(null); setSelectedRoom(null); setMessages([]); localStorage.removeItem(STORAGE_KEY); }}
              className="w-full py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isConnected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-4">🤖</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">AI Agent Hub</h2>
              <p className="text-sm text-gray-500 mb-6">Connect to the AI collaboration platform to share project data across apps and AI agents in real-time.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setShowLogin(true); setFormError(''); }}
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
                  Login to Platform
                </button>
                <button onClick={() => { setShowRegister(true); setFormError(''); }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                  Register
                </button>
              </div>
            </div>
          </div>
        ) : !selectedRoom ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500 text-sm">Select a room to start messaging</p>
              {rooms.length === 0 && (
                <button onClick={() => setTab('rooms')} className="mt-3 text-sm text-blue-600 hover:underline">
                  Create your first room →
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Room Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">💬 {selectedRoom.name}</h2>
                <p className="text-xs text-gray-400 font-mono">{selectedRoom.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                  wsStatus === 'connected' ? 'bg-green-50 text-green-700' :
                  wsStatus === 'connecting' ? 'bg-yellow-50 text-yellow-700' :
                  wsStatus === 'error' ? 'bg-red-50 text-red-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    wsStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                    wsStatus === 'connecting' ? 'bg-yellow-400' :
                    wsStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting…' : wsStatus === 'error' ? 'WS Error' : 'Offline'}
                </span>
                <button onClick={() => loadMessages(selectedRoom.id)}
                  className="text-xs text-blue-600 hover:underline">
                  Load history
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {msgLoading && (
                <div className="text-center text-xs text-gray-400">Loading messages...</div>
              )}
              {!msgLoading && messages.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-8">No messages yet. Start the conversation!</div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_name === connectedAgentInfo?.agent_name ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl rounded-xl border px-4 py-2.5 ${MSG_TYPE_COLORS[msg.msg_type] || 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{msg.sender_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
                        msg.msg_type === 'question' ? 'bg-yellow-200' :
                        msg.msg_type === 'answer' ? 'bg-green-200' :
                        msg.msg_type === 'command' ? 'bg-purple-200' :
                        msg.msg_type === 'event' ? 'bg-orange-200' : 'bg-blue-200'
                      }`}>{msg.msg_type}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="text-xs leading-relaxed">
                      {(() => {
                        try {
                          const parsed = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                          if (typeof parsed === 'object') {
                            return <pre className="whitespace-pre-wrap font-mono text-[11px]">{JSON.stringify(parsed, null, 2)}</pre>;
                          }
                        } catch {}
                        return <span>{msg.content}</span>;
                      })()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Send message */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              {!activeAgentToken && (
                <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center justify-between">
                  <span>⚠ No agent connected. Connect an agent to send messages.</span>
                  <button onClick={() => { setTab('agents'); setShowConnectAgent(true); setFormError(''); }}
                    className="text-amber-700 font-semibold underline">Connect now</button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    {(['info', 'question', 'answer', 'command', 'event'] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setMsgType(t)}
                        className={`px-2.5 py-1 text-xs rounded-full font-medium capitalize transition-colors ${msgType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e as any); } }}
                    placeholder={activeAgentToken ? `Send a ${msgType} message... (Enter to send, Shift+Enter for new line)` : 'Connect an agent first to send messages'}
                    disabled={!activeAgentToken}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 disabled:bg-gray-50"
                  />
                </div>
                <button type="submit" disabled={!msgInput.trim() || !activeAgentToken || sending}
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-40 font-medium">
                  {sending ? '...' : 'Send'}
                </button>
              </form>
              {/* Broadcast shortcuts */}
              {activeAgentToken && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-gray-400 self-center font-medium">📡 Broadcast:</span>
                  {([
                    ['project_summary', '📊 Summary'],
                    ['task_update', '✅ Task'],
                    ['milestone_reached', '🏁 Milestone'],
                    ['expense_approved', '💰 Expense'],
                    ['low_stock_alert', '⚠ Stock'],
                  ] as const).map(([type, label]) => (
                    <button key={type} type="button" disabled={broadcasting}
                      onClick={() => handleBroadcast(type, label)}
                      className="px-2.5 py-1 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full hover:bg-indigo-100 disabled:opacity-40 font-medium">
                      {broadcasting ? '…' : label}
                    </button>
                  ))}
                </div>
              )}
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
          </>
        )}
      </div>

      {/* === MODALS === */}

      {/* Login Modal */}
      {showLogin && (
        <Modal title="Login to AI Platform" onClose={() => setShowLogin(false)}>
          <form onSubmit={handleLogin} className="space-y-4">
            <Field label="Email" type="email" value={loginForm.email} onChange={(v) => setLoginForm({ ...loginForm, email: v })} required />
            <Field label="Password" type="password" value={loginForm.password} onChange={(v) => setLoginForm({ ...loginForm, password: v })} required />
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <ModalActions onCancel={() => setShowLogin(false)} loading={formLoading} submitLabel="Login" />
          </form>
        </Modal>
      )}

      {/* Register Modal */}
      {showRegister && (
        <Modal title="Register on AI Platform" onClose={() => setShowRegister(false)}>
          <form onSubmit={handleRegister} className="space-y-4">
            <Field label="Email" type="email" value={registerForm.email} onChange={(v) => setRegisterForm({ ...registerForm, email: v })} required />
            <Field label="Username" type="text" value={registerForm.username} onChange={(v) => setRegisterForm({ ...registerForm, username: v })} required />
            <Field label="Password" type="password" value={registerForm.password} onChange={(v) => setRegisterForm({ ...registerForm, password: v })} required />
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <ModalActions onCancel={() => setShowRegister(false)} loading={formLoading} submitLabel="Register" />
          </form>
        </Modal>
      )}

      {/* Connect Agent Modal */}
      {showConnectAgent && (
        <Modal title="Connect Agent" onClose={() => setShowConnectAgent(false)}>
          <form onSubmit={handleConnectAgent} className="space-y-4">
            <Field label="Agent Name" type="text" value={connectForm.agent_name} onChange={(v) => setConnectForm({ ...connectForm, agent_name: v })} required />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
              <select value={connectForm.project_id} onChange={(e) => setConnectForm({ ...connectForm, project_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Select project...</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <Field label="Description (optional)" type="text" value={connectForm.description} onChange={(v) => setConnectForm({ ...connectForm, description: v })} />
            <Field label="Expires in (minutes)" type="number" value={connectForm.expires_in_minutes} onChange={(v) => setConnectForm({ ...connectForm, expires_in_minutes: v })} />
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <ModalActions onCancel={() => setShowConnectAgent(false)} loading={formLoading} submitLabel="Connect Agent" />
          </form>
        </Modal>
      )}

      {/* New Room Modal */}
      {showNewRoom && (
        <Modal title="Create Room" onClose={() => setShowNewRoom(false)}>
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <Field label="Room Name" type="text" value={roomForm.name} onChange={(v) => setRoomForm({ ...roomForm, name: v })} required />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
              <select value={roomForm.project_id} onChange={(e) => setRoomForm({ ...roomForm, project_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Select project...</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <ModalActions onCancel={() => setShowNewRoom(false)} loading={formLoading} submitLabel="Create Room" />
          </form>
        </Modal>
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <Modal title="Create Platform Project" onClose={() => setShowNewProject(false)}>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <Field label="Name" type="text" value={projectForm.name} onChange={(v) => setProjectForm({ ...projectForm, name: v })} required />
            <Field label="Description (optional)" type="text" value={projectForm.description} onChange={(v) => setProjectForm({ ...projectForm, description: v })} />
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <ModalActions onCancel={() => setShowNewProject(false)} loading={formLoading} submitLabel="Create Project" />
          </form>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const Field = ({ label, type, value, onChange, required }: { label: string; type: string; value: string; onChange: (v: string) => void; required?: boolean }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
  </div>
);

const ModalActions = ({ onCancel, loading, submitLabel }: { onCancel: () => void; loading: boolean; submitLabel: string }) => (
  <div className="flex gap-3 pt-1">
    <button type="button" onClick={onCancel}
      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
      Cancel
    </button>
    <button type="submit" disabled={loading}
      className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
      {loading ? 'Loading...' : submitLabel}
    </button>
  </div>
);

export default AgentHubPage;
