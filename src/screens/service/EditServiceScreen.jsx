import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../utils/api';

const EditServiceScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showLGAModal, setShowLGAModal] = useState(false);

  const categories = [
    { id: 1, label: 'Plumbing', value: 'Plumbing' },
    { id: 2, label: 'Cleaning', value: 'Cleaning' },
    { id: 3, label: 'Beauty & Makeup', value: 'Beauty & Makeup' },
    { id: 4, label: 'IT & Tech Support', value: 'IT & Tech Support' },
    { id: 5, label: 'Photography', value: 'Photography' },
    { id: 6, label: 'Catering', value: 'Catering' },
    { id: 7, label: 'Tutoring', value: 'Tutoring' },
    { id: 8, label: 'Home Repair', value: 'Home Repair' },
  ];

  const nigeriaStates = [
    'Abia', 'Abuja', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
    'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
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
  };

  useEffect(() => {
    fetchServiceDetails();
  }, []);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/services/${id}`);
      if (response.data.success) {
        const service = response.data.service;
        setTitle(service.title);
        setCategory(service.category);
        // Handle price - it could be a number or an object with amount
        const priceValue = typeof service.price === 'object' ? service.price.amount : service.price;
        setPrice(priceValue?.toString() || '');
        setIsNegotiable(typeof service.price === 'object' ? service.price.negotiable : false);
        setCity(service.location?.lga || service.location?.city || '');
        setState(service.location?.state || '');
        setDescription(service.description);
        // Mark existing images as not new
        const existingImages = (service.images || []).map(img => {
          const imageUrl = typeof img === 'object' ? img.url : img;
          return {
            uri: imageUrl,
            isNew: false
          };
        });
        setImages(existingImages);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      setMessage('Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultiple: false, // Pick one at a time for better performance
        quality: 0.6, // Reduced quality for faster upload
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => ({ 
          uri: asset.uri, 
          isNew: true 
        }));
        // Only add if we haven't reached the limit
        const combined = [...images, ...newImages].slice(0, 3);
        setImages(combined);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !category || !city || !state || !description) {
      setMessage('Please fill in all fields.');
      return;
    }

    if (!isNegotiable && !price) {
      setMessage('Please enter a price or mark as negotiable.');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('Uploading... Please wait');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      
      // Send price as object with amount and negotiable
      // Always send the price amount, independent of negotiable status
      const priceData = {
        amount: Number(price) || 0,
        currency: 'NGN',
        negotiable: isNegotiable
      };
      formData.append('price', JSON.stringify(priceData));
      
      // Send location with city (using LGA value)
      const locationData = {
        city: city,
        state: state,
        country: 'Nigeria'
      };
      formData.append('location', JSON.stringify(locationData));
      formData.append('description', description);

      // Only add NEW images to the upload
      const newImages = images.filter(img => img.isNew);
      
      if (newImages.length > 0) {
        newImages.forEach((image, index) => {
          const uriParts = image.uri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          formData.append('images', {
            uri: image.uri,
            type: `image/${fileType}`,
            name: `service-${Date.now()}-${index}.${fileType}`,
          });
        });
      }

      const response = await api.put(`/services/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000,
      });

      if (response.data.success) {
        setMessage('Service updated successfully!');
        setTimeout(() => router.back(), 1000);
      } else {
        setMessage('Failed to update service. Please try again.');
      }
    } catch (error) {
      console.error('Update Error:', error);
      console.error('Error details:', error.response?.data);
      if (error.code === 'ECONNABORTED') {
        setMessage('Upload timeout. Please check your internet connection.');
      } else if (error.response) {
        setMessage(error.response.data?.message || 'Server error. Please try again.');
      } else if (error.request) {
        setMessage('Network error. Please check your connection.');
      } else {
        setMessage('Unable to update service. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.title}>Edit Service</Text>
          <Text style={styles.subtitle}>Update your service details</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        {/* Images Section */}
        <Text style={styles.label}>Service Images</Text>
        <View style={styles.imagesContainer}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageItem}>
              <Image
                source={{ uri: image.uri || image }}
                style={styles.image}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <MaterialCommunityIcons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 3 && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <MaterialCommunityIcons name="plus" size={24} color="#3b82f6" />
            </TouchableOpacity>
          )}
        </View>
        {images.length < 3 && (
          <Text style={styles.imageNote}>Add up to 3 images</Text>
        )}

        <Text style={styles.label}>Service Title</Text>
        <TextInput
          style={styles.inputField}
          placeholder="e.g. Premium Plumbing Fix"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={category ? styles.inputText : styles.placeholderText}>
            {category || 'Select Category'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Price (₦)</Text>
            <TextInput
              style={styles.inputField}
              placeholder="12000"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>State</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowStateModal(true)}
            >
              <Text style={state ? styles.inputText : styles.placeholderText}>
                {state || 'Select State'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.negotiableOption}
          onPress={() => setIsNegotiable(!isNegotiable)}
        >
          <View style={[styles.checkbox, isNegotiable && styles.checkboxChecked]}>
            {isNegotiable && (
              <MaterialCommunityIcons name="check" size={16} color="white" />
            )}
          </View>
          <Text style={styles.negotiableText}>Price is Negotiable</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Local Government Area (LGA)</Text>
        <TouchableOpacity
          style={[styles.input, !state && styles.disabledInput]}
          onPress={() => state && setShowLGAModal(true)}
          disabled={!state}
        >
          <Text style={city ? styles.inputText : styles.placeholderText}>
            {city || (state ? 'Select LGA' : 'Select State First')}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={state ? "#666" : "#ccc"} />
        </TouchableOpacity>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.inputField, styles.textArea]}
          placeholder="Describe your service, experience, and what customers get."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {message ? (
          <Text style={[styles.message, message.includes('successfully') && styles.successMessage]}>
            {message}
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    category === item.value && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setCategory(item.value);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      category === item.value && styles.categoryOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {category === item.value && (
                    <MaterialCommunityIcons name="check" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* State Modal */}
      <Modal
        visible={showStateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={nigeriaStates}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    state === item && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setState(item);
                    setCity(''); // Reset LGA when state changes
                    setShowStateModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      state === item && styles.categoryOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {state === item && (
                    <MaterialCommunityIcons name="check" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* LGA Modal */}
      <Modal
        visible={showLGAModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLGAModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select LGA - {state}</Text>
              <TouchableOpacity onPress={() => setShowLGAModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={lgasByState[state] || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    city === item && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setCity(item);
                    setShowLGAModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      city === item && styles.categoryOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {city === item && (
                    <MaterialCommunityIcons name="check" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  content: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 32,
    paddingTop: 48,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    minHeight: 120,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 13,
    color: '#dbeafe',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  imageItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
  },
  imageNote: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputField: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#1f2937',
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  message: {
    marginTop: 12,
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
  },
  successMessage: {
    color: '#16a34a',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryOptionSelected: {
    backgroundColor: '#f0f9ff',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#333',
  },
  categoryOptionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  inputText: {
    color: '#333',
    fontSize: 13,
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  disabledInput: {
    opacity: 0.6,
  },
  negotiableOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'white',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  negotiableText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default EditServiceScreen;
