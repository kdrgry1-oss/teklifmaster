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
import { productsAPI } from '../services/api';

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getById(productId);
      setProduct(response.data);
      setFormData({
        ...response.data,
        price: response.data.price?.toString() || '',
        vat_rate: response.data.vat_rate?.toString() || '20',
      });
    } catch (error) {
      Alert.alert('Hata', 'Urun yuklenemedi');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount || 0);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Hata', 'Urun adi ve fiyat zorunludur');
      return;
    }

    try {
      const updateData = {
        ...formData,
        price: parseFloat(formData.price),
        vat_rate: parseInt(formData.vat_rate),
      };
      await productsAPI.update(productId, updateData);
      setProduct(updateData);
      setEditing(false);
      Alert.alert('Basarili', 'Urun guncellendi');
    } catch (error) {
      Alert.alert('Hata', 'Urun guncellenemedi');
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
        <View style={styles.icon}>
          <Ionicons name="cube" size={32} color="#10b981" />
        </View>
        <Text style={styles.productName}>{product?.name}</Text>
        <Text style={styles.productPrice}>{formatCurrency(product?.price)}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditing(!editing)}
        >
          <Ionicons name={editing ? 'close' : 'pencil'} size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Urun/Hizmet Adi</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.name || ''}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          editable={editing}
          placeholder="Urun adi"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Aciklama</Text>
        <TextInput
          style={[styles.input, styles.textArea, !editing && styles.inputDisabled]}
          value={formData.description || ''}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          editable={editing}
          multiline
          numberOfLines={3}
          placeholder="Urun aciklamasi"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Fiyat (TL)</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.price || ''}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          editable={editing}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Birim</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={formData.unit || ''}
              onChangeText={(text) => setFormData({ ...formData, unit: text })}
              editable={editing}
              placeholder="Adet"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>KDV Orani (%)</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={formData.vat_rate || ''}
              onChangeText={(text) => setFormData({ ...formData, vat_rate: text })}
              editable={editing}
              keyboardType="number-pad"
              placeholder="20"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <Text style={styles.label}>Gorsel URL</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={formData.image_url || ''}
          onChangeText={(text) => setFormData({ ...formData, image_url: text })}
          editable={editing}
          placeholder="https://..."
          autoCapitalize="none"
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
  icon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#10b98120',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f97316',
    marginTop: 4,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
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

export default ProductDetailScreen;
