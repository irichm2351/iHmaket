import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { NIGERIAN_STATES } from '../../utils/nigeriaData';

const KYCScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [showIdTypeModal, setShowIdTypeModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [formData, setFormData] = useState({
    idType: 'national_id',
    idNumber: '',
    state: '',
    city: '',
    idDocument: null,
    selfie: null,
  });

  const idTypes = [
    { label: 'National ID', value: 'national_id' },
    { label: 'Driver License', value: 'drivers_license' },
    { label: 'Passport', value: 'passport' },
    { label: 'Voter Card', value: 'voters_card' },
  ];

  const idNumberKeyboardType = formData.idType === 'national_id' ? 'numeric' : 'default';

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
    'Kano': ['Ajinkyira', 'Albasu', 'Algarade', 'Alibo', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin-Kudu', 'Dawakin-Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun-Mallam', 'Gaya', 'Giza', 'Goronyo', 'Gumel', 'Gunau', 'Guri', 'Gwakwio', 'Gwale', 'Gwamna', 'Gwazo', 'Kabo', 'Kachako', 'Kahawa', 'Kanai', 'Kaniati', 'Kannaada', 'Kano', 'Karaki', 'Karguwa', 'Kassai', 'Katsina', 'Kaugama', 'Kaura', 'Kauran-Mata', 'Kauru', 'Kawaji', 'Kayana', 'Kazauge', 'Kazau'],
    'Katsina': ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Danja', 'Dandume', 'Daura', 'Dutsi', 'Dutsinma', 'Fakai', 'Faskari', 'Funtua', 'Gandi', 'Gusau', 'Jibia', 'Jigawa', 'Jiya', 'Jogana', 'Kafur', 'Kaita', 'Kaisena', 'Kankara', 'Kankiya', 'Karosuwa', 'Katsina', 'Kaura', 'Kauran-Mata', 'Kauru', 'Kawaji', 'Kiyawa', 'Kokaji', 'Koraja', 'Kordin', 'Kori', 'Korija', 'Korja', 'Kotagaji', 'Kotakula', 'Kotanaga', 'Kotaragu', 'Kotari'],
    'Kebbi': ['Aleiro', 'Arewa', 'Augie', 'Bagudo', 'Birnin-Kebbi', 'Bugi', 'Bujiya', 'Dakingari', 'Danko', 'Dankolo', 'Dare', 'Dasuki', 'Dassa', 'Daure', 'Daurewa', 'Deka', 'Dikko', 'Dimoro', 'Dinga', 'Disan', 'Dita', 'Ditah', 'Diwu', 'Doguwa', 'Dokaji', 'Dokan', 'Dokina', 'Dokoji', 'Dokor', 'Dolomi'],
    'Kogi': ['Adavi', 'Ajaokuta', 'Ajeokuta', 'Ajoani', 'Akunnu', 'Akunoba', 'Akunodi', 'Akure', 'Aladja-Alakpa', 'Alaji', 'Alafia', 'Alabere', 'Alague', 'Alameji', 'Alamesigwa', 'Alaminiha', 'Alaminiya', 'Alamini', 'Alamitji', 'Alamodi', 'Alamogbado', 'Alamohun', 'Alamo', 'Alamote', 'Alampo', 'Alamu', 'Alanura', 'Alapa', 'Alari', 'Alaro', 'Alasa', 'Aleru', 'Alete', 'Aleti', 'Alevo', 'Alewo', 'Aleza'],
    'Kwara': ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Extent', 'Gwanara', 'Ifeji', 'Ilelah', 'Ilorin-East', 'Ilorin-South', 'Ilorin-West', 'Isin', 'Jebba', 'Jega', 'Jema\'a', 'Jemado', 'Jemadu', 'Jemain', 'Jemake', 'Jemala', 'Jemale', 'Jemali', 'Jemall'],
    'Lagos': ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Bariga', 'Epe', 'Eredo', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Isolo', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Lekki', 'Mushin', 'Ojo', 'Oshi-Oshosudi', 'Shomolu', 'Somolu', 'Surulere'],
    'Nasarawa': ['Akwanga', 'Awe', 'Doma', 'Gadabuke', 'Gadi', 'Gaji', 'Gajimakama', 'Galaja', 'Galawa', 'Galbaja', 'Galbajama', 'Galbakse', 'Galbajeme', 'Galbakemmi', 'Galbakemu'],
    'Niger': ['Agaie', 'Agama', 'Agara', 'Agasa', 'Agene', 'Agenu', 'Ageringbe', 'Agerinmu', 'Ageriniu', 'Agerinumedu', 'Ageri', 'Agerini', 'Agerinu', 'Ageru'],
    'Ogun': ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Ijebu-East', 'Ijebu-North', 'Ijebu-North-East', 'Ijebu-Ode', 'Ikenne', 'Imeko-Afon', 'Ipokia', 'Obafemi-Owode', 'Odeda', 'Odogbolu', 'Oghara', 'Omo-Afo', 'Onilebaji', 'Onitsha', 'Orengun', 'Owu', 'Owu-Ijebu'],
    'Ondo': ['Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West', 'Akure North', 'Akure South', 'Amedawe', 'Amedawe', 'Amedawe', 'Amedawe', 'Amennadu', 'Amenadugba', 'Amenadugbale', 'Amenadugbamu'],
    'Osun': ['Afijapon', 'Afijepon', 'Afijepon', 'Afijepon', 'Afijepon', 'Afijepon', 'Afijepon', 'Afijepon'],
    'Oyo': ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Iyo', 'Iyaganku'],
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

  const pickIdDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData({ ...formData, idDocument: result.assets[0] });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takeSelfie = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take a selfie');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData({ ...formData, selfie: result.assets[0] });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSubmit = async () => {
    if (!formData.idType || !formData.idNumber || !formData.state || !formData.city || !formData.idDocument || !formData.selfie) {
      Alert.alert('Error', 'Please fill in all fields and upload required documents');
      return;
    }

    try {
      setSubmitting(true);

      const data = new FormData();
      data.append('idType', formData.idType);
      data.append('idNumber', formData.idNumber);
      data.append('state', formData.state);
      data.append('city', formData.city);

      const idDocUri = formData.idDocument.uri;
      const idDocParts = idDocUri.split('.');
      const idDocType = idDocParts[idDocParts.length - 1];
      data.append('kycImage', {
        uri: idDocUri,
        type: `image/${idDocType}`,
        name: `id-document.${idDocType}`,
      });

      const selfieUri = formData.selfie.uri;
      const selfieParts = selfieUri.split('.');
      const selfieType = selfieParts[selfieParts.length - 1];
      data.append('selfieImage', {
        uri: selfieUri,
        type: `image/${selfieType}`,
        name: `selfie.${selfieType}`,
      });

      const response = await api.post('/auth/kyc', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000,
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'KYC submitted successfully! We will review your documents and notify you once verified.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit KYC. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Become a Provider</Text>
          <Text style={styles.headerSubtitle}>Complete KYC verification</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color="#3b82f6" />
          <Text style={styles.infoText}>
            To ensure trust and safety, all service providers must verify their identity. 
            This process is quick and secure.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ID Type *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowIdTypeModal(true)}
            disabled={submitting}
          >
            <Text style={styles.dropdownText}>
              {idTypes.find((type) => type.value === formData.idType)?.label || 'Select ID Type'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ID Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your ID number"
            keyboardType={idNumberKeyboardType}
            value={formData.idNumber}
            onChangeText={(value) => setFormData({ ...formData, idNumber: value })}
            editable={!submitting}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>State *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowStateModal(true)}
            disabled={submitting}
          >
            <Text style={[styles.dropdownText, !formData.state && styles.placeholderText]}>
              {formData.state || 'Select State'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>City/LGA *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowCityModal(true)}
            disabled={submitting || !formData.state}
          >
            <Text style={[styles.dropdownText, !formData.city && styles.placeholderText]}>
              {formData.city || (formData.state ? 'Select City/LGA' : 'Select state first')}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ID Document *</Text>
          <TouchableOpacity
            style={styles.uploadCard}
            onPress={pickIdDocument}
            disabled={submitting}
          >
            {formData.idDocument ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: formData.idDocument.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setFormData({ ...formData, idDocument: null })}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <MaterialCommunityIcons name="file-upload" size={40} color="#9ca3af" />
                <Text style={styles.uploadText}>Upload ID Document</Text>
                <Text style={styles.uploadHint}>Clear photo of your ID</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Selfie with ID *</Text>
          <TouchableOpacity
            style={styles.uploadCard}
            onPress={takeSelfie}
            disabled={submitting}
          >
            {formData.selfie ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: formData.selfie.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setFormData({ ...formData, selfie: null })}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <MaterialCommunityIcons name="camera" size={40} color="#9ca3af" />
                <Text style={styles.uploadText}>Take Selfie</Text>
                <Text style={styles.uploadHint}>Hold your ID next to your face</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="white" />
              <Text style={styles.submitButtonText}>Submit KYC</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      <Modal
        visible={showIdTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowIdTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowIdTypeModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select ID Type</Text>
              <TouchableOpacity onPress={() => setShowIdTypeModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {idTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={styles.modalOption}
                onPress={() => {
                  setFormData({ ...formData, idType: type.value });
                  setShowIdTypeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{type.label}</Text>
                {formData.idType === type.value && (
                  <MaterialCommunityIcons name="check" size={24} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showStateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStateModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {NIGERIAN_STATES.map((state) => (
                <TouchableOpacity
                  key={state}
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, state: state });
                    setShowStateModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{state}</Text>
                  {formData.state === state && (
                    <MaterialCommunityIcons name="check" size={24} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showCityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCityModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCityModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City/LGA</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {(lgasByState[formData.state] || []).map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData({ ...formData, city: city });
                    setShowCityModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{city}</Text>
                  {formData.city === city && (
                    <MaterialCommunityIcons name="check" size={24} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 32,
    paddingTop: 48,
    marginBottom: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    minHeight: 120,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#dbeafe',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dropdownText: {
    fontSize: 14,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  uploadCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 12,
  },
  uploadHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
});

export default KYCScreen;
