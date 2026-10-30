import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SendIcon, HeadsetIcon } from 'lucide-react';
import { chatSeed } from '../../data/customer';
import { useApp } from '../../contexts/AppContext';
import { cn } from '../../utils/cn';

interface Message {
  id: string;
  from: 'agent' | 'me';
  text: string;
  time: string;
}

const quick = ['When will ORD-10482 arrive?', 'Can I change the delivery slot?', 'I want to escalate'];

function replyFor(text: string, executed: boolean): string {
  const t = text.toLowerCase();
  if (t.includes('arrive') || t.includes('eta') || t.includes('when'))
  return executed ?
  'Good news — ORD-10482 is now scheduled for Fri, 30 Oct between 2 PM and 5 PM. Replacement stock is already on its way to our Chennai hub.' :
  'ORD-10482 is scheduled for Sat, 31 Oct between 10 AM and 1 PM. We’re working on bringing it forward and will message you if it changes.';
  if (t.includes('slot') || t.includes('change')) return 'I can move it to an afternoon slot on the same day. Shall I request 2 PM – 5 PM for you?';
  if (t.includes('escalat')) return 'I’ve escalated this to our duty manager and linked it to complaint CMP-1182. You’ll get a call within 30 minutes.';
  return 'Thanks, I’ve noted that. Is there an order number I should look at?';
}

function now(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function CareChat({ className }: {className?: string;}) {
  const { workflow } = useApp();
  const [messages, setMessages] = useState<Message[]>(chatSeed);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, typing]);

  const send = (value: string) => {
    const v = value.trim();
    if (!v || typing) return;
    setMessages((m) => [...m, { id: `u${Date.now()}`, from: 'me', text: v, time: now() }]);
    setText('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { id: `a${Date.now()}`, from: 'agent', text: replyFor(v, workflow.state === 'executed'), time: now() }]);
    }, 1000);
  };

  return (
    <section className={cn('flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card', className)} aria-label="Customer care chat">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-fg">
          <HeadsetIcon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Divya · SwiftLane care</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-risk-low" aria-hidden /> Online · replies in ~1 min
          </p>
        </div>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-canvas/60 px-4 py-4" aria-live="polite">
        <AnimatePresence initial={false}>
          {messages.map((m) =>
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
            
              <div className={cn('max-w-[85%] rounded-2xl px-3.5 py-2 text-sm', m.from === 'me' ? 'rounded-br-md bg-primary text-primary-fg' : 'rounded-bl-md border border-line bg-surface text-ink')}>
                {m.text}
                <span className={cn('mt-1 block text-[10px]', m.from === 'me' ? 'text-primary-fg/70' : 'text-muted')}>{m.time}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {typing &&
        <div className="flex gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-3" style={{ width: 'fit-content' }} aria-label="Agent is typing">
            {[0, 1, 2].map((i) =>
          <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${i * 120}ms` }} />
          )}
          </div>
        }
        <div ref={endRef} />
      </div>
      <div className="border-t border-line p-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto">
          {quick.map((q) =>
          <button
            key={q}
            onClick={() => send(q)}
            className="shrink-0 whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 transition-colors duration-150 hover:bg-surface-2">
            
              {q}
            </button>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
          className="flex gap-2">
          
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            aria-label="Message"
            className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25" />
          
          <button type="submit" disabled={!text.trim() || typing} className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-fg transition-opacity duration-150 disabled:opacity-40" aria-label="Send message">
            <SendIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>);

}