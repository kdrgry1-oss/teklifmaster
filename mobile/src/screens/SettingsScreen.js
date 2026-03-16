import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
  const openLink = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Hata', 'Baglanti acilamadi');
    });
  };

  const handleClearCache = () => {
    Alert.alert('Onbellek Temizle', 'Onbellek temizlendi', [{ text: 'Tamam' }]);
  };

  const SettingItem = ({ icon, title, subtitle, onPress, showArrow = true, danger = false }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.iconContainer, danger && { backgroundColor: '#fee2e2' }]}>
        <Ionicons name={icon} size={22} color={danger ? '#ef4444' : '#64748b'} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && { color: '#ef4444' }]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uygulama</Text>
        <SettingItem
          icon="globe-outline"
          title="Web Sitesi"
          subtitle="teklifmaster.com"
          onPress={() => openLink('https://teklifmaster.com')}
        />
        <SettingItem
          icon="document-text-outline"
          title="Kullanim Kosullari"
          onPress={() => openLink('https://teklifmaster.com/sozlesme')}
        />
        <SettingItem
          icon="shield-checkmark-outline"
          title="Gizlilik Politikasi"
          onPress={() => openLink('https://teklifmaster.com/gizlilik')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Destek</Text>
        <SettingItem
          icon="help-circle-outline"
          title="Yardim ve Destek"
          subtitle="Sorulariniz icin bize ulasin"
          onPress={() => openLink('mailto:info@teklifmaster.com')}
        />
        <SettingItem
          icon="chatbubble-outline"
          title="Geri Bildirim"
          subtitle="Uygulama hakkinda goruslerinizi paylasin"
          onPress={() => openLink('mailto:info@teklifmaster.com?subject=Mobil%20Uygulama%20Geri%20Bildirimi')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diger</Text>
        <SettingItem
          icon="trash-outline"
          title="Onbellegi Temizle"
          onPress={handleClearCache}
        />
        <SettingItem
          icon="information-circle-outline"
          title="Uygulama Versiyonu"
          subtitle="1.0.0"
          showArrow={false}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>TeklifMaster Pro</Text>
        <Text style={styles.footerSubtext}>Profesyonel Teklif Yonetimi</Text>
        <Text style={styles.copyright}>© 2024 TeklifMaster. Tum haklari saklidir.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#0f172a',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 16,
  },
});

export default SettingsScreen;
