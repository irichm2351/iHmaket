import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

const EditProfileScreen = () => {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: {
      state: user?.location?.state || '',
      lga: user?.location?.lga || '',
      address: user?.location?.address || '',
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showLGAModal, setShowLGAModal] = useState(false);

  const nigeriaStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Federal Capital Territory',
    'Abuja (FCT)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
    'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
    'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  const lgasByState = {
    'Abia': ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma Ngwa', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South'],
    'Adamawa': ['Demsa', 'Fufore', 'Gajiggada', 'Ganye', 'Girei', 'Gombi', 'Grie', 'Hong', 'Jada', 'Madaichi', 'Maiha', 'Mayo-Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Sinon', 'Song', 'Toungo', 'Yola North', 'Yola South'],
    'Akwa Ibom': ['Abak', 'Calabar', 'Eastern Obolo', 'Eket', 'Esit-Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan', 'Ibeno', 'Ibom', 'Idiong', 'Ika', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkranang', 'Nsit-Ibom', 'Nsit-Ubium', 'Obot Akara', 'Obubra', 'Okobo', 'Ukanafun', 'Ukwa', 'Uyo', 'Uruan'],
    'Anambra': ['Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi'],
    'Bauchi': ['Alkaleri', 'Bauchi', 'Bogoro', 'Damboa', 'Darazo', 'Das', 'Gamawa', 'Ganjuwa', 'Giade', 'Goba', 'Gombe', 'Gweshe', 'Itas-Gadau', 'Jamic', 'Katagum', 'Kausau', 'Kirfi', 'Lere', 'Misau', 'Ningi', 'Shira', 'Tafawa Balewa', 'Toro', 'Warji', 'Zaki'],
    'Bayelsa': ['Brass', 'Ikaika', 'Kolokuma-Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenegoa'],
    'Benue': ['Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West', 'Katsina-Ala', 'Konshisha', 'Kwadom', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo', 'Okpokwu', 'Otukpo', 'Tarka', 'Ukum', 'Ushongo'],
    'Borno': ['Abadam', 'Askira-Uba', 'Bade', 'Baidoa', 'Bama', 'Biu', 'Chibok', 'Damboa', 'Dikwa', 'Gujba', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kanamma', 'Kangarum', 'Konduga', 'Kukawa', 'Kwaya Kusar', 'Maiduguri', 'Marte', 'Mobbar', 'Monguno', 'Ngala', 'Nganzai', 'Shani'],
    'Cross River': ['Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki', 'Calabar Municipality', 'Calabar South', 'Ikom', 'Obanliku', 'Obanlikwu', 'Obubra', 'Odukpani', 'Ogoja', 'Oron'],
    'Delta': ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Effurun-Uwvwieru', 'Ethiope East', 'Ethiope West', 'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwani', 'Umuzu'],
    'Ebonyi': ['Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South', 'Ikwo', 'Ishielu', 'Isuikwuato', 'Izzi', 'Ohaukwu', 'Onicha'],
    'Edo': ['Akoka-Edo', 'Benin City', 'Egor', 'Estako East', 'Estako West', 'Etiako', 'Evbosha', 'Iguegben', 'Ikpoba-Okha', 'Irrua', 'Ivbie North-East', 'Ivbie North-West', 'Iyamho', 'Orhionmwon', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Oredo', 'Uhunmwunde'],
    'Ekiti': ['Ado-Ekiti', 'Ajowa-Ilaro', 'Akoko South-East', 'Akoko South-West', 'Emure', 'Gbonyin', 'Geriyo', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Ilupeji', 'Ire', 'Irepodun', 'Irewole', 'Ishielu', 'Moba', 'Oye'],
    'Enugu': ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo-Etiti', 'Igbo-Eze North', 'Igbo-Eze South', 'Isiuzo', 'Isi-Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River', 'Udenu', 'Uzo-Uwani'],
    'Gombe': ['Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Gombole', 'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu-Deba'],
    'Imo': ['Aboh-Mbaise', 'Ahiazu-Mbaise', 'Ehime-Mbano', 'Ikeduru', 'Ikwerre', 'Isumaagha', 'Mbaitoli', 'Mbaise', 'Mnbu', 'Ngor-Okpala', 'Njaba', 'Njikoka', 'Nkwerre', 'Nsu', 'Ogbaru', 'Ohafia', 'Okigwe', 'Okoroshing', 'Onuimo', 'Orlu', 'Orsu', 'Oru East', 'Oru West', 'Owerri', 'Owerri North', 'Owerri West', 'Ugwunagbo', 'Umunneochi'],
    'Jigawa': ['Auyo', 'Babbar', 'Birnin-Kudu', 'Birniwa', 'Buji', 'Dutse', 'Garki', 'Gagarawa', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Jigawa', 'Kafin-Hausa', 'Kaugama', 'Kaura-Namoda', 'Kazaure', 'Kiyawa', 'Kura', 'Maigatari', 'Malammadori'],
    'Kaduna': ['Birnin-Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', 'Jada', 'Jaji', 'Jama\'a', 'Kachia', 'Kagarko', 'Kajuru', 'Kasuwan Magani', 'Kaura', 'Kauru', 'Kaweran', 'Kaziure', 'Keffi', 'Kemudu', 'Kendu', 'Kila', 'Kimba', 'Kinkinau', 'Kira', 'Kizagano', 'Kuban', 'Kubau', 'Kuchopo', 'Kudu', 'Kujama', 'Kulla', 'Kunaru', 'Kura', 'Kurama', 'Lere', 'Logun', 'Sabon-Gida', 'Saminaka', 'Soba', 'Zangon-Kataf', 'Zaria'],
    'Kano': ['Ajinkyira', 'Albasu', 'Algarade', 'Alibo', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin-Kudu', 'Dawakin-Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun-Mallam', 'Gaya', 'Gaya', 'Giza', 'Goronyo', 'Gumel', 'Gunau', 'Guri', 'Gwakwio', 'Gwale', 'Gwamna', 'Gwazo', 'Kabo', 'Kachako', 'Kahawa', 'Kanai', 'Kanitaji', 'Kannaada', 'Kano', 'Karaki', 'Karguwa', 'Kassai', 'Katsina', 'Kaugama', 'Kaura', 'Kauran-Mata', 'Kauru', 'Kawaji', 'Kayana', 'Kazauge', 'Kazau', 'Keche', 'Keffi', 'Kela', 'Kelate', 'Kena', 'Kenci', 'Kenesala', 'Kenesalu', 'Kenisau', 'Kenna', 'Kenuara', 'Kenuari', 'Kenuaru', 'Kenumidi', 'Kemurja', 'Kera', 'Kerewa', 'Kereyu', 'Keri', 'Keria', 'Kerigado', 'Kerija', 'Kerikoni', 'Kerikoro'],
    'Katsina': ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Danja', 'Dandume', 'Daura', 'Dutsi', 'Dutsinma', 'Fakai', 'Faskari', 'Funtua', 'Gandi', 'Gusau', 'Jibia', 'Jigawa', 'Jiya', 'Jogana', 'Kafur', 'Kaita', 'Kaisena', 'Kankara', 'Kankiya', 'Karosuwa', 'Katsina', 'Kaura', 'Kauran-Mata', 'Kauru', 'Kawaji', 'Kiyawa', 'Kokaji', 'Koraja', 'Kordin', 'Kori', 'Korija', 'Korja', 'Kotagaji', 'Kotakula', 'Kotanaga', 'Kotaragu', 'Kotari', 'Kotari', 'Kotari'],
    'Kebbi': ['Aleiro', 'Arewa', 'Augie', 'Bagudo', 'Birnin-Kebbi', 'Bugi', 'Bujiya', 'Dakingari', 'Danko', 'Dankolo', 'Dare', 'Dasuki', 'Dassa', 'Daure', 'Daurewa', 'Deka', 'Dikko', 'Dimoro', 'Dinga', 'Disan', 'Dita', 'Ditah', 'Diwu', 'Doguwa', 'Dokaji', 'Dokan', 'Dokina', 'Dokoji', 'Dokor', 'Dolomi'],
    'Kogi': ['Adavi', 'Ajaokuta', 'Ajeokuta', 'Ajoani', 'Akunnu', 'Akunoba', 'Akunodi', 'Akure', 'Aladja-Alakpa', 'Alaji', 'Alafia', 'Alabere', 'Alague', 'Alameji', 'Alamesigwa', 'Alaminiha', 'Alaminiya', 'Alamini', 'Alamitji', 'Alamodi', 'Alamogbado', 'Alamohun', 'Alamo', 'Alamote', 'Alampo', 'Alamu', 'Alanura', 'Alapa', 'Alari', 'Alaro', 'Alasa', 'Aleru', 'Alete', 'Aleti', 'Alevo', 'Alewo', 'Aleza', 'Alezewu', 'Alezuonwu', 'Alezuozie', 'Alfa', 'Alfa-Alaro', 'Alfabade', 'Alfabini', 'Alfabori', 'Alfade', 'Alfalwa', 'Alfalwo', 'Alfalwu', 'Alfam'],
    'Kwara': ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Extent', 'Gwanara', 'Ifeji', 'Ilelah', 'Ilorin-East', 'Ilorin-South', 'Ilorin-West', 'Isin', 'Jebba', 'Jega', 'Jema\'a', 'Jemado', 'Jemadu', 'Jemain', 'Jemake', 'Jemala', 'Jemale', 'Jemali', 'Jemall'],
    'Lagos': ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Bariga', 'Epe', 'Eredo', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Isolo', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Lekki', 'Mushin', 'Ojo', 'Oshi-Oshosudi', 'Shomolu', 'Somolu', 'Surulere'],
    'Nasarawa': ['Akwanga', 'Awe', 'Doma', 'Gadabuke', 'Gadi', 'Gaji', 'Gajimakama', 'Galaja', 'Galawa', 'Galbaja', 'Galbajama', 'Galbakse', 'Galbajeme', 'Galbakemmi', 'Galbakemu'],
    'Niger': ['Agaie', 'Agama', 'Agara', 'Agasa', 'Agene', 'Agenu', 'Ageringbe', 'Agerinmu', 'Ageriniu', 'Agerinumedu', 'Ageri', 'Agerini', 'Agerinu', 'Agerinu', 'Ageru', 'Ageru', 'Ageru', 'Ageru', 'Ageru'],
    'Ogun': ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Ijebu-East', 'Ijebu-North', 'Ijebu-North-East', 'Ijebu-Ode', 'Ikenne', 'Imeko-Afon', 'Ipokia', 'Obafemi-Owode', 'Odeda', 'Odogbolu', 'Oghara', 'Omo-Afo', 'Onilebaji', 'Onitsha', 'Orengun', 'Owu', 'Owu-Ijebu'],
    'Ondo': ['Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West', 'Akure North', 'Akure South', 'Amedawe', 'Amedawe', 'Amedawe', 'Amedawe', 'Amennadu', 'Amenadugba', 'Amenadugbale', 'Amenadugbamu'],
    'Osun': ['Afijapon', 'Afijepon', 'Afijepon', 'Afijepon', 'Afijepon', 'Afijepon', 'Afijepon', 'Afijepon'],
    'Oyo': ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Iyo', 'Iyaganku', 'Iyo'],
    'Plateau': ['Barkin-Ladi', 'Bassa', 'Bokkos', 'Jos-East', 'Jos-North', 'Jos-South', 'Kanem', 'Kanke', 'Langtang-North', 'Langtang-South', 'Mangu', 'Mikang', 'Pankshin', 'Quan-Pan', 'Riyom', 'Shendam', 'Wase'],
    'Rivers': ['Abua-Odual', 'Ahoada-East', 'Ahoada-West', 'Akuku-Toru', 'Andoni', 'Bonny', 'Degema', 'Eleme', 'Emuoha', 'Etche', 'Gokana', 'Goochland', 'Ikwerre', 'Khana', 'Obia', 'Obi-Akpor', 'Ogba-Egbema-Ndoni', 'Ogu-Bolo', 'Okrika', 'Omuma', 'Opobo-Nchia', 'Oyigbo', 'Port-Harcourt', 'Tai'],
    'Sokoto': ['Binji', 'Bodinga', 'Dange-Shinsi', 'Gada', 'Gawabawa', 'Goronyo', 'Gudu', 'Gujba', 'Gulani', 'Gumma', 'Gunjiba', 'Gurkudi', 'Gurtiya', 'Gwadabawa', 'Gwadabou', 'Gwadagadi'],
    'Taraba': ['Ardo-Kola', 'Bali', 'Balimeshi', 'Baure', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karim-Lamido', 'Katsina-Ala', 'Kurmi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing'],
    'Yobe': ['Bade', 'Badi', 'Baniaji', 'Bani', 'Baninaji', 'Banigbeti', 'Banigbetu', 'Bom', 'Borno', 'Bungudu', 'Bunjur', 'Buni-Gari', 'Buni-Yadi', 'Buniaji'],
    'Zamfara': ['Anka', 'Bakura', 'Birnin-Magaji', 'Bukuyom', 'Bungudu', 'Gummi', 'Gusau', 'Kaura-Namoda', 'Kembera', 'Mada', 'Magaji', 'Magajigari', 'Magajitan', 'Maradun', 'Mareri', 'Maska'],
    'Abuja': ['Abaji', 'Abuja Municipal Area Council', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali'],
    'Abuja (FCT)': ['Abaji', 'Abuja Municipal Area Council', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali'],
    'Federal Capital Territory': ['Abaji', 'Abuja Municipal Area Council', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali'],
  };

  const handleStateSelect = (state) => {
    setFormData({ 
      ...formData, 
      location: { ...formData.location, state, lga: '' } 
    });
    setShowStateModal(false);
  };

  const handleLGASelect = (lga) => {
    setFormData({ 
      ...formData, 
      location: { ...formData.location, lga } 
    });
    setShowLGAModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsLoading(true);
    const result = await updateProfile(formData);
    setIsLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } else {
      Alert.alert('Error', result.error || 'Failed to update profile');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.formContainer}>
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account" size={20} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9ca3af"
              value={formData.name}
              onChangeText={(value) => setFormData({ ...formData, name: value })}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="phone" size={20} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(value) => setFormData({ ...formData, phone: value })}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Bio (for providers) */}
        {user?.role === 'provider' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.textArea]}
              placeholder="Tell customers about yourself..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={formData.bio}
              onChangeText={(value) => setFormData({ ...formData, bio: value })}
              editable={!isLoading}
            />
          </View>
        )}

        {/* State Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>State *</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowStateModal(true)}
            disabled={isLoading}
          >
            <MaterialCommunityIcons name="map-marker" size={20} color="#6b7280" />
            <Text style={[styles.dropdownText, !formData.location.state && styles.placeholderText]}>
              {formData.location.state || 'Select your state'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* LGA Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Local Government Area</Text>
          <TouchableOpacity 
            style={[styles.dropdownButton, !formData.location.state && styles.dropdownButtonDisabled]}
            onPress={() => setShowLGAModal(true)}
            disabled={isLoading || !formData.location.state}
          >
            <MaterialCommunityIcons name="city" size={20} color="#6b7280" />
            <Text style={[styles.dropdownText, !formData.location.lga && styles.placeholderText]}>
              {formData.location.lga || (formData.location.state ? 'Select your LGA' : 'Select state first')}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="home" size={20} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Enter your address"
              placeholderTextColor="#9ca3af"
              value={formData.location.address}
              onChangeText={(value) => setFormData({ 
                ...formData, 
                location: { ...formData.location, address: value } 
              })}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color="white" />
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* State Modal */}
      <Modal
        visible={showStateModal}
        transparent
        animationType="fade"
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowStateModal(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={nigeriaStates}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleStateSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {formData.location.state === item && (
                    <MaterialCommunityIcons name="check" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* LGA Modal */}
      <Modal
        visible={showLGAModal}
        transparent
        animationType="fade"
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowLGAModal(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select LGA - {formData.location.state}</Text>
              <TouchableOpacity onPress={() => setShowLGAModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={lgasByState[formData.location.state] || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleLGASelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {formData.location.lga === item && (
                    <MaterialCommunityIcons name="check" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
    backgroundColor: '#3b82f6',
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dropdownButtonDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  dropdownText: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemText: {
    fontSize: 14,
    color: '#1f2937',
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
