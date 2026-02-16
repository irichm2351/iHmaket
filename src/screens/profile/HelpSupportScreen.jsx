import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const HelpSupportScreen = () => {
  const router = useRouter();

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@ihmaket.com');
  };

  const supportOptions = [
    {
      icon: 'frequently-asked-questions',
      title: 'Help Center / FAQs',
      description: 'Find answers to common questions about bookings, payments, and account issues.',
      color: '#3b82f6',
    },
    {
      icon: 'email',
      title: 'Contact Support',
      description: 'Email us at support@ihmaket.com or chat with us in-app.',
      color: '#10b981',
      action: handleEmailSupport,
    },
    {
      icon: 'alert-circle',
      title: 'Report a Problem',
      description: 'Tell us about bugs or service issues.',
      color: '#f59e0b',
    },
    {
      icon: 'shield-check',
      title: 'Safety & Trust',
      description: 'Guidelines for safe transactions and verified providers.',
      color: '#8b5cf6',
    },
    {
      icon: 'cash-refund',
      title: 'Refunds & Disputes',
      description: 'How to request a refund or open a dispute.',
      color: '#ef4444',
    },
    {
      icon: 'account-check',
      title: 'Account & KYC Help',
      description: 'Need help verifying your account? Start here.',
      color: '#06b6d4',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.welcomeCard}>
          <MaterialCommunityIcons name="help-circle" size={48} color="#3b82f6" />
          <Text style={styles.welcomeTitle}>How can we help you?</Text>
          <Text style={styles.welcomeText}>
            Choose a topic below or contact our support team directly.
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {supportOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={option.action}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
                <MaterialCommunityIcons name={option.icon} size={28} color={option.color} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            Our support team is here to assist you
          </Text>
          <TouchableOpacity style={styles.emailButton} onPress={handleEmailSupport}>
            <MaterialCommunityIcons name="email" size={20} color="white" />
            <Text style={styles.emailButtonText}>Email Support</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    paddingHorizontal: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  contactCard: {
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
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  emailButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default HelpSupportScreen;
