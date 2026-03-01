import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, ScrollView, Image, Modal, FlatList, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../utils/api';

const HomeScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedLGA, setSelectedLGA] = useState('');
  const [dropdownMode, setDropdownMode] = useState('states'); // 'states' or 'lgas'
  const [showDropdown, setShowDropdown] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch featured services on component mount and when location filter changes
  useEffect(() => {
    fetchFeaturedServices();
  }, [selectedState, selectedLGA]);

  // Auto-refresh featured services when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchFeaturedServices();
    }, [])
  );

  const fetchFeaturedServices = async (retryCount = 0) => {
    try {
      setLoadingServices(true);
      const params = {};
      
      // Add state filter if not "All"
      if (selectedState && selectedState !== 'All') {
        params.state = selectedState;
      }
      
      // Add LGA filter if selected
      if (selectedLGA) {
        params.lga = selectedLGA;
      }
      
      const response = await api.get('/services/featured', { params });
      if (response.data.success) {
        setFeaturedServices(response.data.services);
      }
    } catch (error) {
      console.error('Error fetching featured services:', error);
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1})`);
        setTimeout(() => {
          fetchFeaturedServices(retryCount + 1);
        }, delay);
      } else {
        setFeaturedServices([]);
      }
    } finally {
      if (retryCount === 0) {
        setLoadingServices(false);
      }
    }
  };

  const nigeriaStates = [
    'All',
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

  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/(tabs)/services?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/(tabs)/services');
    }
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setSelectedLGA('');
    // If "All" is selected, close dropdown immediately
    if (state === 'All') {
      setShowDropdown(false);
      setDropdownMode('states');
    } else {
      setDropdownMode('lgas');
    }
  };

  const handleLGASelect = (lga) => {
    setSelectedLGA(lga);
    setShowDropdown(false);
    setDropdownMode('states');
  };

  const handleDropdownButtonPress = () => {
    if (selectedState && dropdownMode === 'lgas') {
      setShowDropdown(!showDropdown);
    } else {
      setDropdownMode('states');
      setShowDropdown(!showDropdown);
    }
  };

  const categories = [
    { id: 1, label: 'Plumbing', value: 'Plumbing', icon: 'pipe', image: require('../../../assets/images/plumbing.webp') },
    { id: 2, label: 'Cleaning', value: 'Cleaning', icon: 'spray-bottle', image: require('../../../assets/images/cleaning2.jpg') },
    { id: 3, label: 'Beauty & Makeup', value: 'Beauty & Makeup', icon: 'face-woman-shimmer', image: require('../../../assets/images/beauty_and_makeup.jpg') },
    { id: 4, label: 'IT & Tech Support', value: 'IT & Tech Support', icon: 'laptop', image: require('../../../assets/images/it_and_tech_support.jpg') },
    { id: 5, label: 'Photography', value: 'Photography', icon: 'camera', image: require('../../../assets/images/photography.png') },
    { id: 6, label: 'Catering', value: 'Catering', icon: 'silverware-fork-knife', image: require('../../../assets/images/catering_2.png') },
    { id: 7, label: 'Tutoring', value: 'Tutoring', icon: 'book-open-variant', image: require('../../../assets/images/tutoring.jpg') },
    { id: 8, label: 'Home Repair', value: 'Home Repair', icon: 'hammer-wrench', image: require('../../../assets/images/home_repair.jpg') },
  ];

  return (
    <Animated.ScrollView
      style={styles.container}
      stickyHeaderIndices={[1]}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
    >
      {/* Header - Large */}
      <View style={styles.headerLarge} />

      {/* Sticky Header + Search */}
      <View style={styles.searchBarStickyWrapper}>
        <View style={styles.headerCompact}>
          <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}
            >
            Find trusted professionals near you
          </Animated.Text>
        </View>
        <View style={styles.searchBarContainer}>
          {/* State/LGA Dropdown Button - LEFT SIDE */}
          <TouchableOpacity 
            style={styles.locationDropdownButton}
            onPress={handleDropdownButtonPress}
          >
            <MaterialCommunityIcons name="map-marker" size={18} color="white" />
            <Text style={styles.locationDropdownText}>
              {selectedLGA ? `${selectedState.substring(0, 3)} - ${selectedLGA.substring(0, 8)}` : selectedState ? selectedState : 'All States'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="white" />
          </TouchableOpacity>

          {/* Search Bar - CENTER/RIGHT */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* State/LGA Dropdown Modal */}
        <Modal
          visible={showDropdown}
          transparent
          animationType="fade"
        >
          <TouchableOpacity 
            style={styles.dropdownOverlay}
            onPress={() => {
              setShowDropdown(false);
              setDropdownMode('states');
            }}
          >
            <View style={styles.dropdownContent}>
              <View style={styles.dropdownHeader}>
                <View style={styles.headerTitleRow}>
                  {dropdownMode === 'lgas' && (
                    <TouchableOpacity onPress={() => setDropdownMode('states')}>
                      <MaterialCommunityIcons name="chevron-left" size={24} color="#3b82f6" />
                    </TouchableOpacity>
                  )}
                  <Text style={styles.dropdownTitle}>
                    {dropdownMode === 'states' ? 'Select State' : `LGAs in ${selectedState}`}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => {
                  setShowDropdown(false);
                  setDropdownMode('states');
                }}>
                  <MaterialCommunityIcons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
              </View>

              {dropdownMode === 'states' ? (
                <FlatList
                  data={nigeriaStates}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleStateSelect(item)}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                      {selectedState === item && (
                        <MaterialCommunityIcons name="check" size={20} color="#3b82f6" />
                      )}
                    </TouchableOpacity>
                  )}
                  scrollEnabled
                  nestedScrollEnabled
                />
              ) : (
                <FlatList
                  data={lgasByState[selectedState] || []}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleLGASelect(item)}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                      {selectedLGA === item && (
                        <MaterialCommunityIcons name="check" size={20} color="#3b82f6" />
                      )}
                    </TouchableOpacity>
                  )}
                  scrollEnabled
                  nestedScrollEnabled
                />
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id}
              style={styles.categoryCard}
              onPress={() =>
                router.push(`/(tabs)/services?category=${encodeURIComponent(category.value)}`)
              }
            >
              {category.image ? (
                <Image source={category.image} style={styles.categoryImage} resizeMode="contain" />
              ) : (
                <MaterialCommunityIcons name={category.icon} size={32} color="#3b82f6" />
              )}
              <Text style={styles.categoryName}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Featured Services */}
      <View style={styles.featuredSection}>
        <View style={styles.featuredHeader}>
          <Text style={styles.sectionTitle}>Featured Services</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity 
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <MaterialCommunityIcons 
                name="view-grid" 
                size={20} 
                color={viewMode === 'grid' ? 'white' : '#6b7280'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <MaterialCommunityIcons 
                name="view-list" 
                size={20} 
                color={viewMode === 'list' ? 'white' : '#6b7280'} 
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={viewMode === 'grid' ? styles.featuredGrid : styles.featuredList}>
          {loadingServices ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : featuredServices.length > 0 ? (
            featuredServices.map((service) => (
              <TouchableOpacity
                key={service._id}
                style={viewMode === 'grid' ? styles.featuredCard : styles.featuredCardList}
                onPress={() => router.push(`/service/${service._id}`)}
              >
                <View style={viewMode === 'grid' ? styles.featuredImage : styles.featuredImageList}>
                  {service.images && service.images.length > 0 ? (
                    <Image 
                      source={{ uri: typeof service.images[0] === 'object' ? service.images[0].url : service.images[0] }} 
                      style={viewMode === 'grid' ? styles.featuredImageContent : styles.featuredImageContentList}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialCommunityIcons name="image" size={36} color="#d1d5db" />
                  )}
                </View>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredName} numberOfLines={2}>{service.title}</Text>
                  <Text style={styles.featuredProvider} numberOfLines={1}>by {service.providerId?.name}</Text>
                  <View style={styles.featuredRatingRow}>
                    <MaterialCommunityIcons name="star" size={14} color="#f59e0b" />
                    <Text style={styles.featuredRating}>
                      {service.rating > 0 ? service.rating.toFixed(1) : 'No ratings yet'}
                    </Text>
                    {service.totalReviews > 0 && (
                      <Text style={styles.reviewCount}> ({service.totalReviews})</Text>
                    )}
                  </View>
                  <Text style={styles.featuredPrice}>
                    {`₦${Number(service.price?.amount || 0).toLocaleString('en-NG')}${service.price?.negotiable ? ' • Negotiable' : ''}`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="inbox-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No services available yet</Text>
            </View>
          )}
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Browse Services</Text>
            <Text style={styles.stepDesc}>Find the perfect service provider</Text>
          </View>
        </View>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Book & Chat</Text>
            <Text style={styles.stepDesc}>Schedule and communicate directly</Text>
          </View>
        </View>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Complete & Review</Text>
            <Text style={styles.stepDesc}>Rate your experience</Text>
          </View>
        </View>
      </View>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerLarge: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 20,
    textAlign: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 0,
  },
  searchBarStickyWrapper: {
    backgroundColor: '#3b82f6',
  },
  headerCompact: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: '#3b82f6',
  },
  headerCompactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  searchBarContainer: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  locationDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    minWidth: 120,
    justifyContent: 'center',
  },
  locationDropdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  dropdownContent: {
    maxHeight: 400,
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  categoriesSection: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryImage: {
    width: 70,
    height: 70,
  },
  categoryName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  ctaSection: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  ctaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ctaIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  ctaContent: {
    marginBottom: 12,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  ctaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  ctaButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  featuredSection: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  viewButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  viewButtonActive: {
    backgroundColor: '#3b82f6',
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featuredList: {
    flexDirection: 'column',
  },
  featuredCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  featuredCardList: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  featuredImage: {
    height: 110,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredImageContent: {
    width: '100%',
    height: '100%',
  },
  featuredImageList: {
    width: 100,
    height: 100,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredImageContentList: {
    width: '100%',
    height: '100%',
  },
  featuredInfo: {
    padding: 12,
    flex: 1,
  },
  featuredName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  featuredProvider: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 6,
  },
  featuredRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featuredRating: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  reviewCount: {
    fontSize: 10,
    color: '#6b7280',
  },
  featuredPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b82f6',
  },
  loadingContainer: {
    width: '100%',
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  howItWorksSection: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
});

export default HomeScreen;
