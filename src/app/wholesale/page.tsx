"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, User, FileText, Upload, CheckCircle, ArrowRight, Building, Mail, Phone, MapPin, Instagram, Globe } from 'lucide-react';
import Link from 'next/link';

export default function WholesaleApplicationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: 'offline', // offline, online, distributor
    address: '',
    socialLink: '',
    npwp: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
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
          <h2 className="text-2xl font-display font-medium text-ink mb-3">Application Received!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Thank you for your interest in becoming a wholesale partner. Our team is reviewing your application and will contact you via email or WhatsApp within 1x24 hours.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-ink text-white rounded-full font-medium hover:bg-ink/90 transition-transform active:scale-95"
          >
            Return to Homepage
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-display font-medium text-ink mb-3">Wholesale Partner Application</h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              Join our network of B2B partners to access exclusive wholesale pricing, bulk ordering capabilities, and priority support.
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
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-rose/10 text-rose flex items-center justify-center">
                  <User size={16} />
                </div>
                <h2 className="text-lg font-medium text-ink">Personal Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
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
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
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
                  <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
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

            {/* 2. Business Info */}
            <div className="p-6 md:p-8 space-y-6 bg-gray-50/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Store size={16} />
                </div>
                <h2 className="text-lg font-medium text-ink">Business Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Store / Business Name</label>
                  <div className="relative">
                    <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      required
                      type="text" 
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none"
                      placeholder="e.g. Fashion Hub Jakarta"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Business Type</label>
                  <select 
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none cursor-pointer"
                  >
                    <option value="offline">Offline / Physical Store</option>
                    <option value="online">Online Shop / Social Commerce</option>
                    <option value="distributor">Regional Distributor</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Instagram / Website URL</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="url" 
                      name="socialLink"
                      value={formData.socialLink}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-rose/50 focus:ring-2 focus:ring-rose/20 rounded-xl transition-all outline-none"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Full Business Address</label>
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
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <h2 className="text-lg font-medium text-ink">Verification Documents</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">NPWP (Optional)</label>
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
                      <p className="text-sm font-medium text-ink mb-1">Store Photo</p>
                      <p className="text-xs text-gray-400">Physical store or warehouse</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Submit */}
            <div className="p-6 md:p-8 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 max-w-sm">
                By submitting this application, you agree to our Wholesale Terms of Service and Privacy Policy.
              </p>
              <button 
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-ink text-white rounded-full font-medium transition-all",
                  isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-ink/90 active:scale-95 hover:shadow-lg hover:shadow-ink/20"
                )}
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Submit Application
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
