import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { X, Bug } from 'lucide-react-native';

interface LogEntry {
  type: 'log' | 'warn' | 'error';
  msg: string;
  time: string;
}

const MAX_LOGS = 100;
let globalAddLog: ((entry: LogEntry) => void) | null = null;

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

function intercept(type: LogEntry['type'], args: any[]) {
  const msg = args.map(a => {
    try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
    catch { return String(a); }
  }).join(' ');
  const time = new Date().toLocaleTimeString('id-ID');
  globalAddLog?.({ type, msg, time });
}

console.log = (...args) => { originalLog(...args); intercept('log', args); };
console.warn = (...args) => { originalWarn(...args); intercept('warn', args); };
console.error = (...args) => { originalError(...args); intercept('error', args); };

export default function DebugOverlay() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    globalAddLog = (entry) => {
      setLogs(prev => [...prev.slice(-MAX_LOGS + 1), entry]);
    };
    return () => { globalAddLog = null; };
  }, []);

  useEffect(() => {
    if (visible) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [logs, visible]);

  const colorMap = { log: '#E5E7EB', warn: '#FEF3C7', error: '#FEE2E2' };
  const textColorMap = { log: '#374151', warn: '#92400E', error: '#991B1B' };

  return (
    <>
      <Pressable style={styles.fab} onPress={() => setVisible(v => !v)}>
        {visible ? <X size={20} color="#fff" /> : <Bug size={20} color="#fff" />}
        {!visible && logs.filter(l => l.type === 'error').length > 0 && (
          <View style={styles.errorDot} />
        )}
      </Pressable>

      {visible && (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Debug Logs ({logs.length})</Text>
            <Pressable onPress={() => setLogs([])}>
              <Text style={styles.clearBtn}>Clear</Text>
            </Pressable>
          </View>
          <ScrollView ref={scrollRef} style={styles.logList} showsVerticalScrollIndicator={false}>
            {logs.length === 0 && <Text style={styles.emptyText}>Belum ada log</Text>}
            {logs.map((log, i) => (
              <View key={i} style={[styles.logItem, { backgroundColor: colorMap[log.type] }]}>
                <Text style={styles.logTime}>{log.time}</Text>
                <Text style={[styles.logMsg, { color: textColorMap[log.type] }]} numberOfLines={5}>{log.msg}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center', elevation: 999, zIndex: 999, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6 },
  errorDot: { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff' },
  panel: { position: 'absolute', bottom: Platform.OS === 'ios' ? 150 : 130, left: 12, right: 12, height: 320, backgroundColor: '#111827', borderRadius: 16, overflow: 'hidden', elevation: 998, zIndex: 998 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#374151' },
  panelTitle: { color: '#F9FAFB', fontWeight: '700', fontSize: 13 },
  clearBtn: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  logList: { flex: 1, padding: 8 },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 20, fontSize: 12 },
  logItem: { borderRadius: 8, padding: 8, marginBottom: 6 },
  logTime: { fontSize: 9, color: '#9CA3AF', marginBottom: 2 },
  logMsg: { fontSize: 11, lineHeight: 16 },
});
