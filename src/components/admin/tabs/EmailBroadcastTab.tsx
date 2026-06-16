import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Customer } from '../types';

export function EmailBroadcastTab({ customers }: { customers: Customer[] }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [specificEmail, setSpecificEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const validCustomers = customers.filter(c => c.email && c.email.includes('@'));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setStatus('error');
      setStatusMessage('Subject and message cannot be empty.');
      return;
    }

    const targetEmails = targetType === 'all' 
      ? validCustomers.map(c => c.email)
      : specificEmail.split(',').map(e => e.trim()).filter(e => e.includes('@'));

    if (targetEmails.length === 0) {
      setStatus('error');
      setStatusMessage('No valid email targets found.');
      return;
    }

    if (!confirm(`Are you sure you want to send this broadcast to ${targetEmails.length} recipient(s)?`)) {
      return;
    }

    setIsSending(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/admin/broadcast-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          messageHtml: message.replace(/\n/g, '<br/>'),
          recipients: targetEmails,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send broadcast');

      setStatus('success');
      setStatusMessage(`Successfully sent to ${data.sentCount} recipient(s).`);
      setSubject('');
      setMessage('');
      setSpecificEmail('');
    } catch (err: any) {
      setStatus('error');
      setStatusMessage(err.message || 'An error occurred while sending the broadcast.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl"
    >
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-display font-medium text-ink flex items-center gap-2">
          <Mail className="text-ink/80" />
          Email Broadcast
        </h2>
        <p className="text-xs text-ink/90 mt-1">
          Send newsletters, promotions, and updates to your customers using the NINOC HTML template.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Form Column */}
        <div className="md:col-span-2">
          <form onSubmit={handleSend} className="bg-white border border-ink/10 shadow-sm p-3 flex flex-col gap-5">
            
            {/* Target Selection */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">Target Audience</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-ink/10 rounded hover:bg-ink/[0.02] transition-colors flex-1">
                  <input 
                    type="radio" 
                    name="targetType" 
                    value="all" 
                    checked={targetType === 'all'} 
                    onChange={() => setTargetType('all')}
                    className="accent-ink"
                  />
                  <div className="flex items-center gap-2 text-xs text-ink/80">
                    <Users size={16} />
                    All Customers ({validCustomers.length})
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-ink/10 rounded hover:bg-ink/[0.02] transition-colors flex-1">
                  <input 
                    type="radio" 
                    name="targetType" 
                    value="specific" 
                    checked={targetType === 'specific'} 
                    onChange={() => setTargetType('specific')}
                    className="accent-ink"
                  />
                  <div className="flex items-center gap-2 text-xs text-ink/80">
                    <Mail size={16} />
                    Specific Emails
                  </div>
                </label>
              </div>
              
              {targetType === 'specific' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={specificEmail}
                    onChange={(e) => setSpecificEmail(e.target.value)}
                    placeholder="example1@mail.com, example2@mail.com"
                    className="w-full px-2 py-1 bg-ink/[0.02] border border-ink/10 text-xs focus:outline-none focus:border-ink/30 transition-colors"
                  />
                  <p className="text-[10px] text-ink/80 mt-1 uppercase tracking-widest">Separate multiple emails with commas</p>
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: NINOC Archive - End of Year Sale"
                className="w-full px-2 py-1 bg-ink/[0.02] border border-ink/10 text-xs focus:outline-none focus:border-ink/30 transition-colors"
                required
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">Message Content</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={10}
                placeholder="Write your beautiful message here..."
                className="w-full px-2 py-1.5 bg-ink/[0.02] border border-ink/10 text-xs focus:outline-none focus:border-ink/30 transition-colors resize-y custom-scrollbar"
                required
              />
              <p className="text-[10px] text-ink/80 mt-1 uppercase tracking-widest">Line breaks will be converted to paragraphs automatically.</p>
            </div>

            {/* Status Messages */}
            {status === 'success' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle size={16} />
                {statusMessage}
              </div>
            )}
            {status === 'error' && (
              <div className="p-3 bg-rose/10 border border-rose/20 text-rose text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                {statusMessage}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-ink/10">
              <button
                type="submit"
                disabled={isSending}
                className="w-full px-6 py-1.5 bg-ink text-white text-xs font-medium uppercase tracking-widest hover:bg-rose transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Sending Broadcast...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Broadcast
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Info Column */}
        <div className="md:col-span-1">
          <div className="bg-ink/[0.02] border border-ink/10 p-5 sticky top-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink mb-4 border-b border-ink/10 pb-2">How it works</h3>
            
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle size={12} /></div>
                <div>
                  <p className="text-xs font-medium text-ink">NINOC Template</p>
                  <p className="text-[11px] text-ink/80 mt-0.5 leading-relaxed">Your message will automatically be wrapped in the professional NINOC Archive HTML email template.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><Users size={12} /></div>
                <div>
                  <p className="text-xs font-medium text-ink">BCC Delivery</p>
                  <p className="text-[11px] text-ink/80 mt-0.5 leading-relaxed">To protect privacy, bulk emails are sent using BCC. Recipients won&apos;t see each other&apos;s addresses.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5"><AlertCircle size={12} /></div>
                <div>
                  <p className="text-xs font-medium text-ink">Gmail Limits</p>
                  <p className="text-[11px] text-ink/80 mt-0.5 leading-relaxed">Standard Gmail limits you to 500 emails per rolling 24 hours. Please broadcast responsibly.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
