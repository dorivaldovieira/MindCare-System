'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Stethoscope, 
  UserPlus, 
  Search, 
  FileText, 
  Calendar, 
  LogOut,
  Activity,
  ChevronRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  CreditCard,
  Hash,
  MapPin,
  Phone,
  Save,
  X,
  Fingerprint,
  Users,
  Contact as ContactIcon,
  Heart,
  Upload,
  File,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  ClipboardList,
  History,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { auth, db, storage } from '@/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  onSnapshot,
  limit,
  setDoc,
  runTransaction,
  getDocFromServer
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

type View = 'dashboard' | 'cadastrar-profissional' | 'cadastrar-cliente' | 'consultar-cliente' | 'consultar-profissional' | 'ficha-atendimento' | 'editar-profissional' | 'editar-cliente';

export default function MindCareApp() {
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [activeView, setActiveView] = React.useState<View>('dashboard');
  const [editingProfessional, setEditingProfessional] = React.useState<any>(null);
  const [editingClient, setEditingClient] = React.useState<any>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    // Connection test
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveView('dashboard');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <LoginView />
      </ErrorBoundary>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cadastrar-profissional', label: 'Cadastrar Profissional', icon: Stethoscope },
    { id: 'consultar-profissional', label: 'Consultar Profissional', icon: Users },
    { id: 'cadastrar-cliente', label: 'Cadastrar Cliente', icon: UserPlus },
    { id: 'consultar-cliente', label: 'Consultar Cliente', icon: Search },
    { id: 'ficha-atendimento', label: 'Ficha de Atendimento', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <Activity className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">MindCare</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                activeView === item.id 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                activeView === item.id ? "text-white" : "text-slate-400 group-hover:text-emerald-400"
              )} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-end px-8 gap-4 bg-[#111827]/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-white">Dr. Ricardo Silva</span>
            <span className="text-xs text-slate-400">Administrador</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm border-2 border-emerald-500/20">
            RS
          </div>
        </header>

        {/* View Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === 'dashboard' && <DashboardView setActiveView={setActiveView} />}
              {activeView === 'cadastrar-profissional' && (
                <ProfessionalFormView 
                  onCancel={() => setActiveView('dashboard')} 
                />
              )}
              {activeView === 'editar-profissional' && (
                <ProfessionalFormView 
                  professional={editingProfessional} 
                  onCancel={() => setActiveView('consultar-profissional')} 
                />
              )}
              {activeView === 'consultar-profissional' && (
                <ProfessionalSearchView 
                  onCancel={() => setActiveView('dashboard')} 
                  onEdit={(prof) => {
                    setEditingProfessional(prof);
                    setActiveView('editar-profissional');
                  }}
                />
              )}
              {activeView === 'cadastrar-cliente' && (
                <ClientFormView 
                  onCancel={() => setActiveView('dashboard')} 
                />
              )}
              {activeView === 'editar-cliente' && (
                <ClientFormView 
                  client={editingClient} 
                  onCancel={() => setActiveView('consultar-cliente')} 
                />
              )}
              {activeView === 'consultar-cliente' && (
                <ClientSearchView 
                  onCancel={() => setActiveView('dashboard')} 
                  onEdit={(client) => {
                    setEditingClient(client);
                    setActiveView('editar-cliente');
                  }}
                />
              )}
              {activeView === 'ficha-atendimento' && <ServiceRecordView onCancel={() => setActiveView('dashboard')} />}
              {activeView !== 'dashboard' && activeView !== 'cadastrar-profissional' && activeView !== 'consultar-profissional' && activeView !== 'cadastrar-cliente' && activeView !== 'consultar-cliente' && activeView !== 'ficha-atendimento' && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                  <h2 className="text-2xl font-bold text-slate-300 mb-2">
                    {menuItems.find(i => i.id === activeView)?.label}
                  </h2>
                  <p>Esta funcionalidade está sendo implementada.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function ClientSearchView({ onCancel, onEdit }: { onCancel: () => void, onEdit: (client: any) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clients');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      const q = query(
        collection(db, 'service_records'),
        where('clientId', '==', selectedClient.id),
        orderBy('date', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const historyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClientHistory(historyData);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'service_records');
      });

      // Update attached files from the client document
      // We need to find the latest client data from the 'clients' state or fetch it
      const currentClient = clients.find(c => c.id === selectedClient.id);
      if (currentClient) {
        setAttachedFiles(currentClient.files || []);
      }

      return () => unsubscribe();
    } else {
      setClientHistory([]);
      setAttachedFiles([]);
    }
  }, [selectedClient, clients]);

  const filteredClients = clients.filter(c => 
    (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (c.cpf || '').includes(searchTerm)
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && selectedClient) {
      const files = Array.from(e.target.files);
      setIsUploading(true);
      
      try {
        const newFiles = [...attachedFiles];
        
        for (const file of files) {
          const storageRef = ref(storage, `clients/${selectedClient.id}/${Date.now()}_${file.name}`);
          const uploadTask = await uploadBytes(storageRef, file);
          const downloadUrl = await getDownloadURL(uploadTask.ref);
          
          newFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: downloadUrl,
            uploadedAt: new Date().toISOString()
          });
        }

        const clientRef = doc(db, 'clients', selectedClient.id);
        await updateDoc(clientRef, {
          files: newFiles,
          updatedAt: serverTimestamp()
        });
        
        setAttachedFiles(newFiles);
      } catch (error) {
        console.error('Error uploading files:', error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = async (index: number) => {
    if (!selectedClient) return;
    
    const newFiles = attachedFiles.filter((_, i) => i !== index);
    try {
      const clientRef = doc(db, 'clients', selectedClient.id);
      await updateDoc(clientRef, {
        files: newFiles,
        updatedAt: serverTimestamp()
      });
      setAttachedFiles(newFiles);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${selectedClient.id}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Consultar Cliente</h2>
          <p className="text-slate-400 mt-1">Busque por pacientes e gerencie seus documentos.</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search and List Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111827] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resultados</span>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={cn(
                      "w-full p-4 flex items-center justify-between border-b border-slate-800/50 transition-all hover:bg-slate-800/30 text-left",
                      selectedClient?.id === client.id ? "bg-emerald-500/10 border-l-4 border-l-emerald-500" : ""
                    )}
                  >
                    <div>
                      <p className="font-semibold text-white">{client.name}</p>
                      <p className="text-xs text-slate-500">CPF: {client.cpf}</p>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 transition-transform", selectedClient?.id === client.id ? "rotate-90 text-emerald-500" : "text-slate-600")} />
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-slate-600">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhum cliente encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details and Upload Section */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedClient ? (
              <motion.div
                key={selectedClient.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-xl space-y-8"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedClient.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-mono text-slate-500">ID: {selectedClient.id}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          selectedClient.status === 'Ativo' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {selectedClient.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEdit(selectedClient)}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    >
                      <User className="w-4 h-4" />
                      Editar Perfil
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          await deleteDoc(doc(db, 'clients', selectedClient.id));
                          setSelectedClient(null);
                        } catch (error) {
                          handleFirestoreError(error, OperationType.DELETE, `clients/${selectedClient.id}`);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                      title="Excluir Cliente"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setSelectedClient(null)}
                      className="p-2 text-slate-500 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 py-6 border-y border-slate-800/50">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Documento</p>
                    <p className="text-white font-medium">{selectedClient.cpf}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Última Consulta</p>
                    <p className="text-white font-medium">{clientHistory[0]?.date || 'N/A'}</p>
                  </div>
                </div>

                {/* Patient History Section */}
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-500" />
                    Histórico de Atendimentos
                  </h4>
                  
                  <div className="space-y-4">
                    {clientHistory.length > 0 ? (
                      clientHistory.map((entry: any, idx: number) => (
                        <div key={idx} className="relative pl-6 border-l border-slate-800 pb-4 last:pb-0">
                          <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <div className="bg-slate-900/30 rounded-2xl p-4 border border-slate-800/50 hover:border-emerald-500/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{entry.date}</span>
                                <span className="text-[10px] text-slate-500 font-medium">{entry.professionalName}</span>
                              </div>
                              <button 
                                onClick={async () => {
                                  try {
                                    await deleteDoc(doc(db, 'service_records', entry.id));
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.DELETE, `service_records/${entry.id}`);
                                  }
                                }}
                                className="p-1 text-slate-600 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {entry.notes}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center bg-slate-900/20 rounded-2xl border border-slate-800/50">
                        <p className="text-sm text-slate-500 italic">Nenhum histórico de atendimento registrado.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* File Attachment Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-500" />
                      Anexos e Documentos
                    </h4>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Upload className="w-4 h-4" />
                      Anexar Arquivo
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,image/png,image/jpeg"
                      multiple
                      className="hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {attachedFiles.length > 0 ? (
                      attachedFiles.map((file, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {file.type.includes('image') ? (
                              <ImageIcon className="w-8 h-8 text-blue-400 shrink-0" />
                            ) : (
                              <File className="w-8 h-8 text-orange-400 shrink-0" />
                            )}
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium text-white truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-500 uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFile(idx)}
                            className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-2 py-12 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600">
                        <Upload className="w-10 h-10 mb-4 opacity-10" />
                        <p className="text-sm">Nenhum arquivo anexado</p>
                        <p className="text-xs mt-1 opacity-50">PDF, PNG ou JPEG até 10MB</p>
                      </div>
                    )}
                  </div>

                  {attachedFiles.length > 0 && (
                    <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                      <Save className="w-5 h-5" />
                      Salvar Alterações
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600">
                <div className="bg-slate-900/50 p-6 rounded-full mb-6">
                  <Search className="w-12 h-12 opacity-20" />
                </div>
                <h3 className="text-xl font-bold text-slate-400">Selecione um cliente</h3>
                <p className="max-w-xs text-center mt-2">Escolha um paciente na lista ao lado para visualizar detalhes e anexar documentos.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ClientFormView({ client, onCancel }: { client?: any, onCancel: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cpf: client?.cpf || '',
    rg: client?.rg || '',
    name: client?.name || '',
    address: client?.address || '',
    phone: client?.phone || '',
    contact: client?.contact || '',
    cid: client?.cid || '',
    father: client?.father || '',
    mother: client?.mother || '',
    clinicalHistory: client?.clinicalHistory || '',
    status: client?.status || 'Ativo'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (client?.id) {
        await updateDoc(doc(db, 'clients', client.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'clients'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      onCancel();
    } catch (error) {
      handleFirestoreError(error, client?.id ? OperationType.UPDATE : OperationType.CREATE, client?.id ? `clients/${client.id}` : 'clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {client?.id ? 'Editar Cliente' : 'Cadastrar Cliente'}
          </h2>
          <p className="text-slate-400 mt-1">
            {client?.id ? 'Atualize as informações do paciente abaixo.' : 'Preencha as informações do novo paciente abaixo.'}
          </p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CPF */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">CPF</label>
            <div className="relative group">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                required
                placeholder="000.000.000-00"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* RG */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">RG</label>
            <div className="relative group">
              <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="rg"
                value={formData.rg}
                onChange={handleChange}
                required
                placeholder="00.000.000-0"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Nome Completo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 ml-1">Nome Completo</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Digite o nome completo do cliente"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Endereço */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Endereço</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Rua, número, bairro, cidade"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Telefone</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="(00) 00000-0000"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contato (Responsável/Emergência) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Contato (Responsável)</label>
            <div className="relative group">
              <ContactIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="Nome do contato de emergência"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* CID */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">CID</label>
            <div className="relative group">
              <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="cid"
                value={formData.cid}
                onChange={handleChange}
                placeholder="Código Internacional de Doenças"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pai */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Pai</label>
            <div className="relative group">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="father"
                value={formData.father}
                onChange={handleChange}
                placeholder="Nome do pai"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Mãe */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Mãe</label>
            <div className="relative group">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="mother"
                value={formData.mother}
                onChange={handleChange}
                placeholder="Nome da mãe"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Histórico Clínico / Observações */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 ml-1">Histórico Clínico / Observações</label>
          <div className="relative group">
            <ClipboardList className="absolute left-4 top-6 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <textarea 
              name="clinicalHistory"
              value={formData.clinicalHistory}
              onChange={handleChange}
              rows={4}
              placeholder="Descreva o histórico clínico relevante ou observações iniciais..."
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button 
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Cliente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProfessionalFormView({ professional, onCancel }: { professional?: any, onCancel: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cpf: professional?.cpf || '',
    registerNumber: professional?.registerNumber || '',
    name: professional?.name || '',
    specialty: professional?.specialty || '',
    email: professional?.email || '',
    address: professional?.address || '',
    phone: professional?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (professional?.id) {
        await updateDoc(doc(db, 'professionals', professional.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'professionals'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      onCancel();
    } catch (error) {
      handleFirestoreError(error, professional?.id ? OperationType.UPDATE : OperationType.CREATE, professional?.id ? `professionals/${professional.id}` : 'professionals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {professional?.id ? 'Editar Profissional' : 'Cadastrar Profissional'}
          </h2>
          <p className="text-slate-400 mt-1">
            {professional?.id ? 'Atualize as informações do profissional abaixo.' : 'Preencha as informações do novo profissional abaixo.'}
          </p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CPF */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">CPF</label>
            <div className="relative group">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                required
                placeholder="000.000.000-00"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Registro (CRP/CRM) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Registro (CRP/CRM)</label>
            <div className="relative group">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="registerNumber"
                value={formData.registerNumber}
                onChange={handleChange}
                required
                placeholder="00/00000"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome Completo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Nome Completo</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Digite o nome completo"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Especialidade */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Especialidade</label>
            <div className="relative group">
              <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                required
                placeholder="Ex: Psicólogo Clínico"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* E-mail */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="profissional@email.com"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Endereço */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Endereço</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Rua, número, bairro, cidade"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Telefone</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="(00) 00000-0000"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button 
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Profissional
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


function ServiceRecordView({ onCancel }: { onCancel: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cid: '',
    evolution: '',
  });

  React.useEffect(() => {
    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubPros = onSnapshot(collection(db, 'professionals'), (snapshot) => {
      setProfessionals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubClients();
      unsubPros();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const client = clients.find(c => c.id === selectedClient);
    const professional = professionals.find(p => p.id === selectedProfessional);

    try {
      await addDoc(collection(db, 'service_records'), {
        clientId: selectedClient,
        clientName: client?.name || 'Unknown',
        professionalId: selectedProfessional,
        professionalName: professional?.name || 'Unknown',
        ...formData,
        createdAt: serverTimestamp(),
      });
      onCancel();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'service_records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Ficha de Atendimento</h2>
          <p className="text-slate-400 mt-1">Registre a evolução e detalhes da consulta do paciente.</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selecionar Cliente */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Paciente</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <select 
                required
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
              >
                <option value="" disabled className="bg-[#111827]">Selecione o paciente</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#111827]">{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Selecionar Profissional */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Profissional</label>
            <div className="relative group">
              <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <select 
                required
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
              >
                <option value="" disabled className="bg-[#111827]">Selecione o profissional</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#111827]">{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Data</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Hora */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Hora</label>
            <div className="relative group">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="time" 
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* CID */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">CID</label>
            <div className="relative group">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                name="cid"
                value={formData.cid}
                onChange={handleChange}
                placeholder="Ex: F32.9"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Evolução */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 ml-1">Evolução do Caso</label>
          <div className="relative group">
            <ClipboardList className="absolute left-4 top-6 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <textarea 
              name="evolution"
              value={formData.evolution}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Descreva detalhadamente a evolução do paciente nesta sessão..."
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button 
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Atendimento
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError('Ocorreu um erro ao entrar. Verifique sua conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-emerald-500/20 p-4 rounded-2xl mb-4">
              <Activity className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">MindCare</h1>
            <p className="text-slate-400 mt-2">Acesse sua conta para continuar</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-slate-300">Senha</label>
                <button type="button" className="text-xs text-emerald-500 hover:text-emerald-400 font-medium">Esqueceu a senha?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              Não tem uma conta? <button className="text-emerald-500 font-semibold hover:text-emerald-400">Solicite acesso</button>
            </p>
          </div>
        </div>
        
        <p className="text-center text-slate-600 text-xs mt-8">
          &copy; 2026 MindCare Health Systems. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  );
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl">
            <div className="bg-red-500/20 p-4 rounded-2xl inline-block mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Ops! Algo deu errado</h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Ocorreu um erro inesperado no sistema. Nossa equipe técnica já foi notificada.
            </p>
            <div className="bg-slate-900/50 rounded-xl p-4 mb-8 text-left overflow-auto max-h-40">
              <code className="text-xs text-red-400 font-mono">
                {this.state.error?.message}
              </code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Recarregar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


function ProfessionalSearchView({ onCancel, onEdit }: { onCancel: () => void, onEdit: (prof: any) => void }) {
  const [professionals, setProfessionals] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedProfessional, setSelectedProfessional] = React.useState<any | null>(null);

  React.useEffect(() => {
    const q = query(collection(db, 'professionals'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProfessionals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'professionals');
    });
    return () => unsubscribe();
  }, []);

  const filteredProfessionals = professionals.filter(p => 
    (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.specialty?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.registerNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'professionals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `professionals/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Consultar Profissionais</h2>
          <p className="text-slate-400 mt-1">Gerencie a equipe de profissionais da clínica.</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nome, especialidade ou registro..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#111827] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfessionals.map((prof) => (
          <motion.div
            key={prof.id}
            layoutId={prof.id}
            className="bg-[#111827] border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(prof)}
                  className="p-2 text-slate-500 hover:text-emerald-500 transition-colors"
                >
                  <User className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(prof.id)}
                  className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{prof.name}</h3>
            <p className="text-emerald-500 text-sm font-medium mb-4">{prof.specialty}</p>
            
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-3 text-slate-400">
                <Hash className="w-4 h-4" />
                <span className="text-xs">{prof.registerNumber}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Mail className="w-4 h-4" />
                <span className="text-xs truncate">{prof.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Phone className="w-4 h-4" />
                <span className="text-xs">{prof.phone}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProfessionals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
          <Search className="w-12 h-12 mb-4 opacity-20" />
          <p>Nenhum profissional encontrado.</p>
        </div>
      )}
    </div>
  );
}
function DashboardView({ setActiveView }: { setActiveView: (view: View) => void }) {
  const initialStats = React.useMemo(() => [
    { label: 'Pacientes Ativos', value: '0', color: 'bg-blue-500', collection: 'clients' },
    { label: 'Consultas Hoje', value: '0', color: 'bg-emerald-500', collection: 'service_records' },
    { label: 'Profissionais', value: '0', color: 'bg-purple-500', collection: 'professionals' },
    { label: 'Pendências', value: '0', color: 'bg-orange-500', collection: 'none' },
  ], []);

  const [stats, setStats] = React.useState(initialStats);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [chartData, setChartData] = React.useState<any[]>([]);

  React.useEffect(() => {
    const unsubscribers = initialStats.map((stat, index) => {
      if (stat.collection === 'none') return null;
      
      const q = stat.collection === 'service_records' 
        ? query(collection(db, stat.collection), where('date', '==', new Date().toISOString().split('T')[0]))
        : collection(db, stat.collection);

      return onSnapshot(q, (snapshot) => {
        setStats(prev => {
          const newStats = [...prev];
          newStats[index].value = snapshot.size.toString();
          return newStats;
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, stat.collection);
      });
    });

    // Recent Activity
    const qRecent = query(collection(db, 'service_records'), orderBy('createdAt', 'desc'), limit(5));
    const unsubRecent = onSnapshot(qRecent, (snapshot) => {
      setRecentActivity(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Chart Data (last 7 days)
    const qChart = query(collection(db, 'service_records'), orderBy('date', 'desc'), limit(30));
    const unsubChart = onSnapshot(qChart, (snapshot) => {
      const records = snapshot.docs.map(doc => doc.data());
      const countsByDate: { [key: string]: number } = {};
      
      // Get last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        countsByDate[dateStr] = 0;
      }

      records.forEach(r => {
        if (r.date && countsByDate[r.date] !== undefined) {
          countsByDate[r.date]++;
        }
      });

      const data = Object.entries(countsByDate).map(([date, count]) => ({
        name: date ? date.split('-').slice(1).reverse().join('/') : 'N/A',
        value: count
      }));
      setChartData(data);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub && unsub());
      unsubRecent();
      unsubChart();
    };
  }, [initialStats]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard</h2>
          <p className="text-slate-400 mt-1">Visão geral do sistema e atividades recentes.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-slate-300">
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#111827] p-6 rounded-3xl border border-slate-800 hover:border-emerald-500/30 transition-all group shadow-xl"
          >
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">{stat.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold text-white tracking-tighter">{stat.value}</span>
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity", stat.color.replace('bg-', 'bg-opacity-20 text-'))}>
                {index === 0 && <Users className="w-6 h-6" />}
                {index === 1 && <Calendar className="w-6 h-6" />}
                {index === 2 && <Stethoscope className="w-6 h-6" />}
                {index === 3 && <Clock className="w-6 h-6" />}
              </div>
            </div>
            <div className={cn("h-1.5 w-12 mt-6 rounded-full", stat.color)} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Volume de Atendimentos
            </h3>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Últimos 7 dias</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#f8fafc'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#10b981' : '#334155'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-8">
            <History className="w-5 h-5 text-emerald-500" />
            Atividades Recentes
          </h3>
          <div className="space-y-6 flex-1">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <div key={activity.id} className="flex gap-4 group">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-500 transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    {idx !== recentActivity.length - 1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-10 bg-slate-800" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{activity.clientName || 'Paciente'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Atendido por {activity.professionalName || 'Profissional'}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-1">{activity.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50 space-y-4">
                <Clock className="w-12 h-12" />
                <p className="text-sm italic">Nenhuma atividade recente encontrada.</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setActiveView('consultar-cliente')}
            className="w-full mt-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-all"
          >
            Ver Todos os Registros
          </button>
        </div>
      </div>
    </div>
  );
}
