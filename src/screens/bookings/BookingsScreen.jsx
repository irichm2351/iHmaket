import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	ScrollView,
	Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

const FILTERS = ['all', 'pending', 'accepted', 'completed', 'cancelled'];

const BookingsScreen = () => {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { user } = useAuthStore();
	const { resetBookingCount } = useNotificationStore();
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(false);
	const [filter, setFilter] = useState('all');
	const [bookingType, setBookingType] = useState('received'); // For providers: 'received' or 'placed'
	const [showDropdown, setShowDropdown] = useState(false);
	const flatListRef = useRef(null);

	// When navigating from booking success, update to the specified tab
	useEffect(() => {
		if (params?.bookingType) {
			setBookingType(params.bookingType);
		}
	}, [params?.bookingType]);

	useEffect(() => {
		fetchBookings();
	}, [filter, bookingType]);

	useFocusEffect(
		React.useCallback(() => {
			fetchBookings();
			// Reset booking count when viewing bookings
			resetBookingCount();
		}, [filter, bookingType, resetBookingCount])
	);

	useFocusEffect(
		React.useCallback(() => {
			// Scroll to booking if returning from messages
			if (params?.scrollToBookingId && bookings.length > 0) {
				setTimeout(() => {
					const index = bookings.findIndex(b => b._id === params.scrollToBookingId);
					if (index !== -1) {
						flatListRef.current?.scrollToIndex({ index, animated: true });
					}
				}, 100);
			}
		}, [params?.scrollToBookingId, bookings])
	);

	const fetchBookings = async () => {
		try {
			setLoading(true);
			const params = {};

			if (filter !== 'all') {
				params.status = filter;
			}

			if (user?.role === 'provider') {
				params.type = bookingType; // 'received' or 'placed'
			}

			// DEBUG LOG
			console.log('========== FETCHING BOOKINGS ==========');
			console.log('User Role:', user?.role);
			console.log('Booking Type:', bookingType);
			console.log('Filter:', filter);
			console.log('Request Params:', JSON.stringify(params));
			console.log('=======================================');

			const response = await api.get('/bookings', { params });
			
			// DEBUG LOG
			console.log('========== BOOKINGS RESPONSE ==========');
			console.log('Number of bookings:', response.data.bookings?.length);
			console.log('Bookings:', response.data.bookings?.map(b => ({
				id: b._id,
				service: b.serviceId?.title,
				customer: b.customerId?.name,
				provider: b.providerId?.name,
			})));
			console.log('=======================================');
			
			setBookings(response.data.bookings || []);
		} catch (error) {
			console.error('Error fetching bookings:', error);
			setBookings([]);
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateStatus = async (bookingId, status) => {
		try {
			await api.put(`/bookings/${bookingId}/status`, { status });
			fetchBookings();
		} catch (error) {
			Alert.alert('Error', error.response?.data?.message || 'Failed to update booking');
		}
	};

	const handleCancelBooking = async (bookingId) => {
		Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
			{ text: 'No', style: 'cancel' },
			{
				text: 'Yes',
				style: 'destructive',
				onPress: async () => {
					try {
						await api.put(`/bookings/${bookingId}/cancel`, { reason: 'Cancelled by user' });
						fetchBookings();
					} catch (error) {
						Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking');
					}
				},
			},
		]);
	};

	const handleMessage = (item) => {
		const isProvider = user?.role === 'provider';
		const recipientId = isProvider ? item.customerId?._id : item.providerId?._id;
		const recipientName = isProvider ? item.customerId?.name : item.providerId?.name;
		const recipientProfilePic = isProvider ? item.customerId?.profilePic : item.providerId?.profilePic;

		if (!recipientId || !recipientName) {
			Alert.alert('Error', 'Unable to message at this time');
			return;
		}

		router.push({
			pathname: '/booking-message',
			params: {
				providerId: recipientId,
				providerName: recipientName,
				providerProfilePic: recipientProfilePic,
				fromPreviousScreen: true,
				scrollToBookingId: item._id,
			},
		});
	};

	const renderBooking = ({ item }) => {
		const isProvider = user?.role === 'provider';
		const otherUserName = isProvider ? item.customerId?.name : item.providerId?.name;
		const priceAmount = item?.price?.amount ?? item?.price ?? 0;
		const locationText = [
			item?.location?.address,
			item?.location?.city,
			item?.location?.state,
		]
			.filter(Boolean)
			.join(', ');

		return (
			<View style={styles.card}>
				<View style={styles.cardHeader}>
					<Text style={styles.title}>{item.serviceId?.title || 'Service'}</Text>
					<View style={[styles.badge, styles[`badge_${item.status}`]]}>
						<Text style={styles.badgeText}>{item.status}</Text>
					</View>
				</View>

				<Text style={styles.subText}>
					{isProvider ? 'Customer' : 'Provider'}: {otherUserName || 'User'}
				</Text>

				<View style={styles.infoRow}>
					<MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
					<Text style={styles.infoText}>
						{item.scheduledDate
							? new Date(item.scheduledDate).toLocaleDateString()
							: 'Date not set'}
					</Text>
				</View>

				<View style={styles.infoRow}>
					<MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
					<Text style={styles.infoText}>{item.scheduledTime || 'Time not set'}</Text>
				</View>

				<View style={styles.infoRow}>
					<MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
					<Text style={styles.infoText}>{locationText || 'Location not set'}</Text>
				</View>

				<Text style={styles.price}>₦{Number(priceAmount).toLocaleString()}</Text>

				{item.notes ? (
					<Text style={styles.notes}>
						<Text style={styles.notesLabel}>Notes:</Text> {item.notes}
					</Text>
				) : null}

				<View style={styles.actions}>
					<TouchableOpacity
						style={[styles.actionButton, styles.messageButton]}
						onPress={() => handleMessage(item)}
					>
						<MaterialCommunityIcons name="message-text-outline" size={16} color="white" />
						<Text style={[styles.actionButtonText, { marginLeft: 6 }]}>Message</Text>
					</TouchableOpacity>

					{isProvider && item.status === 'pending' && (
						<>
							<TouchableOpacity
								style={[styles.actionButton, styles.primaryButton]}
								onPress={() => handleUpdateStatus(item._id, 'accepted')}
							>
								<Text style={styles.actionButtonText}>Accept</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.actionButton, styles.secondaryButton]}
								onPress={() => handleUpdateStatus(item._id, 'rejected')}
							>
								<Text style={styles.actionButtonText}>Reject</Text>
							</TouchableOpacity>
						</>
					)}

					{isProvider && item.status === 'accepted' && (
						<TouchableOpacity
							style={[styles.actionButton, styles.primaryButton]}
							onPress={() => handleUpdateStatus(item._id, 'completed')}
						>
							<Text style={styles.actionButtonText}>Mark Completed</Text>
						</TouchableOpacity>
					)}

					{item.status === 'pending' && (
						<TouchableOpacity
							style={[styles.actionButton, styles.dangerButton]}
							onPress={() => handleCancelBooking(item._id)}
						>
							<Text style={styles.actionButtonText}>Cancel</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>
		);
	};

	if (!user) {
		return (
			<View style={styles.centerContent}>
				<Text style={styles.emptyText}>Please log in to view bookings</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.filterSection}>
				<Text style={styles.filterLabel}>Filter by Status:</Text>
				<TouchableOpacity
					style={styles.dropdownButton}
					onPress={() => setShowDropdown(true)}
				>
					<Text style={styles.dropdownButtonText}>
						{filter.charAt(0).toUpperCase() + filter.slice(1)}
					</Text>
					<MaterialCommunityIcons name="chevron-down" size={20} color="#6b7280" />
				</TouchableOpacity>
			</View>

			{/* Booking Type Tabs for Providers */}
			{user?.role === 'provider' && (
				<View style={styles.bookingTypeSection}>
					<TouchableOpacity
						style={[
							styles.bookingTypeTab,
							bookingType === 'received' && styles.bookingTypeTabActive,
						]}
						onPress={() => {
							setBookings([]); // Clear bookings before switching
							setBookingType('received');
						}}
					>
						<Text
							style={[
								styles.bookingTypeTabText,
								bookingType === 'received' && styles.bookingTypeTabTextActive,
							]}
						>
							Services Offered
						</Text>
				{bookingType === 'received' && <View style={styles.bookingTypeTabIndicator} />}
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.bookingTypeTab,
							bookingType === 'placed' && styles.bookingTypeTabActive,
						]}
						onPress={() => {
							setBookings([]); // Clear bookings before switching
							setBookingType('placed');
						}}
					>
						<Text
							style={[
								styles.bookingTypeTabText,
								bookingType === 'placed' && styles.bookingTypeTabTextActive,
							]}
						>
							My Bookings
						</Text>
				{bookingType === 'placed' && <View style={styles.bookingTypeTabIndicator} />}
					</TouchableOpacity>
				</View>
			)}

			<Modal
				visible={showDropdown}
				transparent
				animationType="fade"
				onRequestClose={() => setShowDropdown(false)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setShowDropdown(false)}
				>
					<View style={styles.dropdownModal}>
						{FILTERS.map((status) => (
							<TouchableOpacity
								key={status}
								style={[
									styles.dropdownItem,
									filter === status && styles.dropdownItemActive,
								]}
								onPress={() => {
									setFilter(status);
									setShowDropdown(false);
								}}
							>
								<Text
									style={[
										styles.dropdownItemText,
										filter === status && styles.dropdownItemTextActive,
									]}
								>
									{status.charAt(0).toUpperCase() + status.slice(1)}
								</Text>
								{filter === status && (
									<MaterialCommunityIcons name="check" size={20} color="#3b82f6" />
								)}
							</TouchableOpacity>
						))}
					</View>
				</TouchableOpacity>
			</Modal>

			{loading ? (
				<View style={styles.centerContent}>
					<ActivityIndicator size="large" color="#3b82f6" />
				</View>
			) : bookings.length === 0 ? (
				<View style={styles.centerContent}>
					<MaterialCommunityIcons name="calendar-remove" size={48} color="#d1d5db" />
					<Text style={styles.emptyText}>No bookings found</Text>
				</View>
			) : (
				<FlatList
					ref={flatListRef}
					data={bookings}
					keyExtractor={(item) => item._id}
					renderItem={renderBooking}
					contentContainerStyle={styles.listContent}
					scrollEventThrottle={16}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f9fafb',
	},
	filterSection: {
		height: 100,
		justifyContent: 'flex-end',
		paddingBottom: 12,
		paddingHorizontal: 15,
		backgroundColor: 'white',
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	bookingTypeSection: {
		flexDirection: 'row',
		backgroundColor: 'white',
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
		paddingHorizontal: 12,
	},
	bookingTypeTab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	bookingTypeTabActive: {
		borderBottomWidth: 2,
		borderBottomColor: '#3b82f6',
	},
	bookingTypeTabText: {
		fontSize: 13,
		fontWeight: '500',
		color: '#6b7280',
	},
	bookingTypeTabTextActive: {
		color: '#3b82f6',
		fontWeight: '600',
	},
	bookingTypeTabIndicator: {
		position: 'absolute',
		bottom: 0,
		height: 2,
		backgroundColor: '#3b82f6',
		width: '100%',
	},
	filterLabel: {
		fontSize: 12,
		fontWeight: '600',
		color: '#6b7280',
		marginBottom: 4,
	},
	dropdownButton: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 6,
		backgroundColor: '#f9fafb',
	},
	dropdownButtonText: {
		fontSize: 13,
		color: '#1f2937',
		fontWeight: '500',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	dropdownModal: {
		backgroundColor: 'white',
		borderRadius: 12,
		minWidth: 200,
		maxWidth: '80%',
		paddingVertical: 8,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	dropdownItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	dropdownItemActive: {
		backgroundColor: '#eff6ff',
	},
	dropdownItemText: {
		fontSize: 14,
		color: '#1f2937',
		textTransform: 'capitalize',
	},
	dropdownItemTextActive: {
		fontWeight: '600',
		color: '#3b82f6',
	},
	listContent: {
		padding: 12,
	},
	card: {
		backgroundColor: 'white',
		borderRadius: 12,
		padding: 14,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 6,
		elevation: 2,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 6,
	},
	title: {
		fontSize: 16,
		fontWeight: '700',
		color: '#111827',
		flex: 1,
		marginRight: 10,
	},
	badge: {
		paddingVertical: 4,
		paddingHorizontal: 10,
		borderRadius: 12,
	},
	badgeText: {
		fontSize: 11,
		fontWeight: '600',
		textTransform: 'capitalize',
	},
	badge_pending: { backgroundColor: '#fef3c7' },
	badge_accepted: { backgroundColor: '#dbeafe' },
	badge_completed: { backgroundColor: '#dcfce7' },
	badge_cancelled: { backgroundColor: '#fee2e2' },
	badge_rejected: { backgroundColor: '#fee2e2' },
	subText: {
		fontSize: 13,
		color: '#6b7280',
		marginBottom: 8,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
	},
	infoText: {
		marginLeft: 8,
		color: '#4b5563',
		fontSize: 13,
	},
	price: {
		fontSize: 15,
		fontWeight: '700',
		color: '#2563eb',
		marginTop: 6,
	},
	notes: {
		marginTop: 8,
		color: '#4b5563',
		fontSize: 13,
	},
	notesLabel: {
		fontWeight: '600',
	},
	actions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 10,
	},
	actionButton: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		marginRight: 8,
		marginBottom: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	actionButtonText: {
		color: 'white',
		fontSize: 12,
		fontWeight: '600',
	},
	primaryButton: {
		backgroundColor: '#3b82f6',
	},
	secondaryButton: {
		backgroundColor: '#6b7280',
	},
	dangerButton: {
		backgroundColor: '#ef4444',
	},
	messageButton: {
		backgroundColor: '#8b5cf6',
	},
	centerContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyText: {
		marginTop: 12,
		fontSize: 15,
		color: '#6b7280',
	},
});

export default BookingsScreen;
