import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { authAPI, subscriptionAPI } from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [formData, setFormData] = useState({
    company_name: user?.company_name || '',
    company_phone: user?.company_phone || '',
    company_address: user?.company_address || '',
    company_tax_number: user?.company_tax_number || '',
  });

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await subscriptionAPI.getStatus();
      setSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await authAPI.updateProfile(formData);
      updateUser(formData);
      setEditing(false);
      Alert.alert('Basarili', 'Profil guncellendi');
    } catch (error) {
      Alert.alert('Hata', 'Profil guncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cikis Yap', 'Cikmak istediginizden emin misiniz?', [
      { text: 'Iptal', style: 'cancel' },
      { text: 'Cikis Yap', style: 'destructive', onPress: logout },
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'trial':
        return '#f59e0b';
      default:
        return '#ef4444';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'trial':
        return 'Deneme';
      default:
        return 'Pasif';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.company_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.companyName}>{user?.company_name || 'Sirket Adi'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Subscription Status */}
      <View style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <Ionicons name="star" size={24} color="#f97316" />
          <Text style={styles.subscriptionTitle}>Abonelik Durumu</Text>
        </View>
        <View style={styles.subscriptionInfo}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription?.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(subscription?.status) }]}>
              {getStatusText(subscription?.status)}
            </Text>
          </View>
          {subscription?.is_trial_active && subscription?.trial_days_left > 0 && (
            <Text style={styles.trialText}>
              {subscription.trial_days_left} gun kaldi
            </Text>
          )}
        </View>
      </View>

      {/* Profile Form */}
      <View style={styles.form}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Sirket Bilgileri</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Ionicons name={editing ? 'close' : 'pencil'} size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Sirket Adi</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.company_name}
          onChangeText={(text) => setFormData({ ...formData, company_name: text })}
          editable={editing}
          placeholder="Sirket adi"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Telefon</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.company_phone}
          onChangeText={(text) => setFormData({ ...formData, company_phone: text })}
          editable={editing}
          keyboardType="phone-pad"
          placeholder="Telefon numarasi"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Adres</Text>
        <TextInput
          style={[styles.input, styles.textArea, !editing && styles.inputDisabled]}
          value={formData.company_address}
          onChangeText={(text) => setFormData({ ...formData, company_address: text })}
          editable={editing}
          multiline
          numberOfLines={3}
          placeholder="Sirket adresi"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Vergi No</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.company_tax_number}
          onChangeText={(text) => setFormData({ ...formData, company_tax_number: text })}
          editable={editing}
          placeholder="Vergi numarasi"
          placeholderTextColor="#94a3b8"
        />

        {editing && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Degisiklikleri Kaydet</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#64748b" />
          <Text style={styles.actionText}>Ayarlar</Text>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Cikis Yap</Text>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0f172a',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  email: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trialText: {
    fontSize: 14,
    color: '#f59e0b',
  },
  form: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputDisabled: {
    backgroundColor: '#f8fafc',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#0f172a',
  },
});

export default ProfileScreen;
