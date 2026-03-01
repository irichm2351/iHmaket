import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const TermsPrivacyScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'

  const termsContent = [
    {
      title: '1. User Agreement & Acceptance',
      content: 'By accessing and using iHmaket, you agree to be bound by these Terms of Service. If you do not agree, please discontinue use of the platform.',
    },
    {
      title: '2. User Accounts & Responsibilities',
      content: 'You must create an account to use our services. You are responsible for maintaining the confidentiality of your account credentials and all activities under your account.',
    },
    {
      title: '3. Service Provider Terms',
      content: 'Service providers must complete KYC verification and provide accurate information about their services. Providers are responsible for delivering quality services as advertised.',
    },
    {
      title: '4. Booking & Payment Terms',
      content: 'All bookings are subject to provider acceptance. Payments are NOT processed through our platform - all payment arrangements are made directly between customers and service providers. iHmaket does not handle, process, or hold any payments. Customers and providers agree on payment methods (cash, bank transfer, mobile money, etc.) through direct communication.',
    },
    {
      title: '5. Prohibited Activities',
      content: 'Users may not engage in fraudulent activities, harassment, spam, or any illegal activities. Violations may result in account suspension or termination.',
    },
    {
      title: '6. Dispute Resolution',
      content: 'In case of disputes between customers and providers, iHmaket provides mediation services. All disputes should be reported through the platform.',
    },
    {
      title: '7. Liability & Disclaimers',
      content: 'iHmaket acts as a marketplace platform connecting customers with service providers. We are not liable for the quality of services provided by independent service providers, nor are we responsible for payment disputes as all payments are handled directly between parties.',
    },
    {
      title: '8. Modifications to Terms',
      content: 'We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.',
    },
  ];

  const privacyContent = [
    {
      title: '1. Information We Collect',
      content: 'We collect personal information (name, email, phone), profile data, booking history, and usage data to provide and improve our services. We do NOT collect or store payment information as all payments are handled directly between customers and providers.',
    },
    {
      title: '2. How We Use Your Data',
      content: 'Your data is used to facilitate bookings, connect you with service providers, communicate with you, improve our services, and ensure platform security. We do not process payments - all payment arrangements are between you and your service provider.',
    },
    {
      title: '3. Data Sharing & Third Parties',
      content: 'We share your contact information with service providers only when you initiate a booking or conversation. We may share anonymized data for analytics purposes. We never sell your personal data to third parties.',
    },
    {
      title: '4. Data Security',
      content: 'We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your information.',
    },
    {
      title: '5. Your Privacy Rights',
      content: 'You have the right to access, correct, delete, or export your personal data. Contact us at ihmaket2026@gmail.com to exercise your rights.',
    },
    {
      title: '6. Cookies & Tracking',
      content: 'We use cookies and similar technologies to enhance user experience, analyze usage patterns, and provide personalized content.',
    },
    {
      title: '7. Data Retention',
      content: 'We retain your data as long as your account is active or as needed to provide services, comply with legal obligations, and resolve disputes.',
    },
    {
      title: '8. Contact Us',
      content: 'For privacy-related questions or concerns, contact us at ihmaket2026@gmail.com. We will respond within 7 business days.',
    },
  ];

  const content = activeTab === 'terms' ? termsContent : privacyContent;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Privacy</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => setActiveTab('terms')}
        >
          <MaterialCommunityIcons 
            name="file-document-outline" 
            size={20} 
            color={activeTab === 'terms' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
          onPress={() => setActiveTab('privacy')}
        >
          <MaterialCommunityIcons 
            name="shield-lock-outline" 
            size={20} 
            color={activeTab === 'privacy' ? '#3b82f6' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>Last updated: February 9, 2026</Text>
        </View>

        {content.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.contactSection}>
          <MaterialCommunityIcons name="email-outline" size={24} color="#3b82f6" />
          <Text style={styles.contactTitle}>Questions or Concerns?</Text>
          <Text style={styles.contactText}>
            Contact us at ihmaket2026@gmail.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#3b82f6',
    height: 100,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  lastUpdated: {
    backgroundColor: '#dbeafe',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  lastUpdatedText: {
    fontSize: 13,
    color: '#1e40af',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
  },
});

export default TermsPrivacyScreen;
