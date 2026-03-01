import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const HelpSupportScreen = () => {
  const router = useRouter();
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'What is iHmaket?',
      answer: 'iHmaket is a service marketplace platform that connects customers with trusted service providers in Nigeria. Whether you need plumbing, cleaning, beauty services, IT support, or many other professional services, iHmaket makes it easy to find and contact service providers safely and conveniently.',
    },
    {
      id: 2,
      category: 'Getting Started',
      question: 'How do I sign up?',
      answer: 'Tap "Sign Up", enter your email and create a password, then verify your email. You can sign up as either a customer or service provider. Complete your profile with your name, phone number, and profile picture.',
    },
    {
      id: 3,
      category: 'Getting Started',
      question: 'How do I navigate the app?',
      answer: 'The app has 5 main tabs: Home (browse services), Bookings (manage bookings), Messages (chat), Dashboard (your activity), and Profile (settings). Navigate using the bottom menu.',
    },
    {
      id: 4,
      category: 'For Customers',
      question: 'How do I find and contact a service provider?',
      answer: 'Browse services on the Home tab or search. Filter by category, location, or ratings. Tap a service to view details and provider profile. Then message the provider to discuss your needs and pricing.',
    },
    {
      id: 5,
      category: 'For Customers',
      question: 'How does booking work?',
      answer: 'After finding a service, tap "Book Now" to create a booking request. Select your preferred date and time, add special requests, and submit. The provider will receive your request and can accept, decline, or suggest alternatives.',
    },
    {
      id: 6,
      category: 'For Customers',
      question: 'How do I pay for services?',
      answer: 'Payment is handled DIRECTLY between you and the service provider. iHmaket does NOT process online payments. You arrange payment terms (cash, bank transfer, mobile money, etc.) with your provider through messaging. This gives you flexibility to agree on methods that work for both parties.',
    },
    {
      id: 7,
      category: 'For Customers',
      question: 'How do I save services?',
      answer: 'Tap the heart icon on any service card to save it. Access saved services from your Dashboard or Profile tab.',
    },
    {
      id: 8,
      category: 'For Customers',
      question: 'Can I cancel a booking?',
      answer: 'Yes, you can cancel before the service starts. Go to "Bookings", tap the booking, then "Cancel". Please inform the provider as soon as possible.',
    },
    {
      id: 9,
      category: 'For Customers',
      question: 'How do I rate and review?',
      answer: 'After service completion, you\'ll get a notification to review. Go to "Bookings", find the completed service, and tap "Leave Review". Rate 1-5 stars and write feedback.',
    },
    {
      id: 10,
      category: 'For Providers',
      question: 'How do I become a service provider?',
      answer: 'Sign up as a customer first, then go to "Become a Provider" in your profile. Complete KYC verification with ID, business info, and bank details. Approval takes 1-3 business days.',
    },
    {
      id: 11,
      category: 'For Providers',
      question: 'How do I post a service?',
      answer: 'Once verified, tap "Post Service" in Dashboard. Fill in title, description, category, price range, and upload images. Add availability and terms. Tap "Publish" to go live.',
    },
    {
      id: 12,
      category: 'For Providers',
      question: 'How do I manage bookings?',
      answer: 'Go to "Bookings" tab to view all requests. You can accept, decline, or reschedule. Communicate with customers through Messages.',
    },
    {
      id: 13,
      category: 'For Providers',
      question: 'How do I receive payments?',
      answer: 'You arrange payment DIRECTLY with customers. iHmaket does NOT handle payments. Agree on cash, bank transfer, or mobile money through messaging. Discuss payment terms before starting service.',
    },
    {
      id: 14,
      category: 'For Providers',
      question: 'Can I offer different prices?',
      answer: 'Yes! Set different pricing tiers when posting services. You can also negotiate custom pricing with customers through messages.',
    },
    {
      id: 15,
      category: 'Messaging',
      question: 'How do I message providers/customers?',
      answer: 'Tap "Messages" tab to see conversations. To start new chat, visit a service and tap "Message Provider". Discuss details, pricing, and availability.',
    },
    {
      id: 16,
      category: 'Messaging',
      question: 'What should I discuss before booking?',
      answer: 'Discuss exact service details, your requirements, availability, pricing (including extras), payment method, location/travel costs, and expected duration.',
    },
    {
      id: 17,
      category: 'Safety & Security',
      question: 'How is my information protected?',
      answer: 'We use industry-standard encryption. Your contact info is only shared with providers you engage. We never sell your data. Control what\'s visible on your profile.',
    },
    {
      id: 18,
      category: 'Safety & Security',
      question: 'Is iHmaket safe to use?',
      answer: 'All providers complete KYC verification. You can see reviews and ratings. Always communicate through the app, meet in safe public places when possible, and report suspicious behavior immediately.',
    },
    {
      id: 19,
      category: 'Safety & Security',
      question: 'What if I have a problem with a provider?',
      answer: 'First, communicate with the provider through messages. If unresolved, contact ihmaket2026@gmail.com. While we don\'t handle payments, we mediate disputes and take action against policy violations.',
    },
    {
      id: 20,
      category: 'Account',
      question: 'How do I update my profile?',
      answer: 'Go to "Profile" → "Edit Profile". Update your name, phone, picture, location, and bio. Providers can update business info and portfolio.',
    },
    {
      id: 21,
      category: 'Account',
      question: 'How do I change my password?',
      answer: 'Go to Profile → Change Password. Enter current password, then new password twice. Tap "Update Password".',
    },
    {
      id: 22,
      category: 'Account',
      question: 'How do I delete my account?',
      answer: 'Go to Profile → Account Settings → Delete Account. Confirm and provide reason. Account deleted in 30 days. Complete/cancel all active bookings first.',
    },
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const toggleAccordion = (id) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQs</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>How iHmaket Works</Text>
          <Text style={styles.welcomeText}>
            Find trusted service providers, chat to discuss details and pricing, book services, and arrange payment directly with providers.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for answers..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* FAQs */}
        <View style={styles.faqsContainer}>
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleAccordion(faq.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.category}>{faq.category}</Text>
                    <Text style={styles.question}>{faq.question}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={activeAccordion === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#3b82f6"
                  />
                </TouchableOpacity>

                {activeAccordion === faq.id && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answer}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noResults}>
              <MaterialCommunityIcons name="file-question" size={48} color="#d1d5db" />
              <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
              <Text style={styles.noResultsSubtext}>Try different keywords</Text>
            </View>
          )}
        </View>

        {/* Support Section */}
        <View style={styles.supportContainer}>
          <Text style={styles.supportTitle}>Still Need Help?</Text>
          <Text style={styles.supportText}>Contact our support team</Text>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => Linking.openURL('mailto:ihmaket2026@gmail.com')}
          >
            <MaterialCommunityIcons name="email" size={20} color="#ffffff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.supportButtonTitle}>Email Support</Text>
              <Text style={styles.supportButtonSubtitle}>ihmaket2026@gmail.com</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.responseTime}>We typically respond within 24 hours</Text>
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
  welcomeSection: {
    backgroundColor: '#dbeafe',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  faqsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  faqItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f3f4f6',
  },
  category: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 6,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 6,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  answer: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  supportContainer: {
    marginHorizontal: 16,
    marginBottom: 32,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  supportButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  supportButtonSubtitle: {
    fontSize: 12,
    color: '#bfdbfe',
  },
  responseTime: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default HelpSupportScreen;
