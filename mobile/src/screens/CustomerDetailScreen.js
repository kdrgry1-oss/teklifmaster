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
import { customersAPI } from '../services/api';

const CustomerDetailScreen = ({ route, navigation }) => {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const response = await customersAPI.getById(customerId);
      setCustomer(response.data);
      setFormData(response.data);
    } catch (error) {
      Alert.alert('Hata', 'Musteri yuklenemedi');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await customersAPI.update(customerId, formData);
      setCustomer(formData);
      setEditing(false);
      Alert.alert('Basarili', 'Musteri guncellendi');
    } catch (error) {
      Alert.alert('Hata', 'Musteri guncellenemedi');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {customer?.name?.charAt(0).toUpperCase() || 'M'}
          </Text>
        </View>
        <Text style={styles.customerName}>{customer?.name}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditing(!editing)}
        >
          <Ionicons name={editing ? 'close' : 'pencil'} size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Musteri Adi</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.name || ''}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          editable={editing}
          placeholder="Musteri adi"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>E-posta</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.email || ''}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          editable={editing}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="E-posta adresi"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Telefon</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.phone || ''}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          editable={editing}
          keyboardType="phone-pad"
          placeholder="Telefon numarasi"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Adres</Text>
        <TextInput
          style={[styles.input, styles.textArea, !editing && styles.inputDisabled]}
          value={formData.address || ''}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          editable={editing}
          multiline
          numberOfLines={3}
          placeholder="Adres"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Vergi No</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.tax_number || ''}
          onChangeText={(text) => setFormData({ ...formData, tax_number: text })}
          editable={editing}
          placeholder="Vergi numarasi"
          placeholderTextColor="#94a3b8"
        />

        {editing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Degisiklikleri Kaydet</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f620',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#3b82f6',
  },
  customerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  form: {
    padding: 20,
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
    minHeight: 100,
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
});

export default CustomerDetailScreen;
