"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, User, FileText, Upload, CheckCircle, ArrowRight, Mail, Phone, MapPin, Globe } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import { supabase } from '@/lib/supabase';
import { useDictionary } from '@/hooks/useDictionary';

export default function AffiliateApplicationPage() {
  const dict = useDictionary();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    channelName: '',
    instagramLink: '',
    tiktokLink: '',
    youtubeLink: '',
    facebookLink: '',
    address: '',
    npwp: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('affiliate_applications')
        .insert([{
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          channel_name: formData.channelName,
          instagram_link: formData.instagramLink,
          tiktok_link: formData.tiktokLink,
          youtube_link: formData.youtubeLink,
          facebook_link: formData.facebookLink,
          address: formData.address,
          npwp: formData.npwp || null,
          status: 'pending'
        }]);

      if (error) throw error;
      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting application:", error);
      alert(dict.affiliate.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-gray-100 p-8 text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-display font-medium text-ink mb-3">{dict.affiliate.received}</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {dict.affiliate.receivedDesc}
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-ink text-white rounded-full font-medium hover:bg-ink/90 transition-transform active:scale-95"
          >
            {dict.affiliate.returnHome}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-display font-medium text-ink mb-3">{dict.affiliate.title}</h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              {dict.affiliate.subtitle}
            </p>
          </motion.div>
        </div>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
            
            {/* 1. Personal Info */}
            <div className="p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-rose/10 text-rose flex items-center justify-center">
                  <User size={16} />
                </div>
                <h2 className="text-lg font-medium text-ink">{dict.affiliate.personalInfo}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{dict.affiliate.fullName}</label>
                  <input 
                    required
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{dict.affiliate.email}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      required
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">{dict.affiliate.whatsapp}</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      required
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none"
                      placeholder="+62 812 3456 7890"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Platform Info */}
            <div className="p-5 md:p-6 space-y-4 bg-gray-50/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Share2 size={16} />
                </div>
                <h2 className="text-lg font-medium text-ink">{dict.affiliate.channelInfo}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">{dict.affiliate.channelName}</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      required
                      type="text" 
                      name="channelName"
                      value={formData.channelName}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none"
                      placeholder="e.g. @fashionguru"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">{dict.affiliate.igUrl}</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="url" 
                      required
                      name="instagramLink"
                      value={formData.instagramLink}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">TikTok Profile URL</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="url" 
                      required
                      name="tiktokLink"
                      value={formData.tiktokLink}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none"
                      placeholder="https://tiktok.com/@..."
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">YouTube Channel URL</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="url" 
                      required
                      name="youtubeLink"
                      value={formData.youtubeLink}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none"
                      placeholder="https://youtube.com/c/..."
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Facebook Page/Profile URL</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="url" 
                      required
                      name="facebookLink"
                      value={formData.facebookLink}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">{dict.affiliate.address}</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                    <textarea 
                      required
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none resize-none"
                      placeholder="Street, City, Province, Postal Code..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Verification Documents */}
            <div className="p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <h2 className="text-lg font-medium text-ink">{dict.affiliate.addressInfo}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{dict.affiliate.npwp}</label>
                  <input 
                    type="text" 
                    name="npwp"
                    value={formData.npwp}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none"
                    placeholder="00.000.000.0-000.000"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700">Upload Required Documents</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Document 1 */}
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 hover:border-rose/30 transition-colors cursor-pointer group">
                      <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-rose/10 group-hover:text-rose transition-colors">
                        <Upload size={18} />
                      </div>
                      <p className="text-sm font-medium text-ink mb-1">Owner&apos;s ID (KTP)</p>
                      <p className="text-xs text-gray-400">JPG, PNG or PDF (Max 5MB)</p>
                    </div>

                    {/* Document 2 */}
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 hover:border-rose/30 transition-colors cursor-pointer group">
                      <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-rose/10 group-hover:text-rose transition-colors">
                        <Upload size={18} />
                      </div>
                      <p className="text-sm font-medium text-ink mb-1">Profile Insights Screenshot</p>
                      <p className="text-xs text-gray-400">Audience demography & reach</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Submit */}
            <div className="p-5 md:p-6 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 max-w-sm">
                By submitting this application, you agree to our <Link href="/affiliate/terms" className="text-ink underline hover:text-rose transition-colors">Affiliate Terms of Service</Link> and Privacy Policy.
              </p>
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-ink text-white rounded-full font-medium transition-all ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-ink/90 active:scale-95 hover:shadow-lg hover:shadow-ink/20"
                }`}
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {dict.affiliate.submit}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </div>
  );
}
