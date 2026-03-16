import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { quotesAPI, customersAPI, productsAPI, bankAccountsAPI } from '../services/api';

const NewQuoteScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  
  const [quoteName, setQuoteName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedBankAccounts, setSelectedBankAccounts] = useState([]);
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, productsRes, bankRes] = await Promise.all([
        customersAPI.getAll(),
        productsAPI.getAll(),
        bankAccountsAPI.getAll(),
      ]);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
      setBankAccounts(bankRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount || 0);
  };

  const addProduct = (product) => {
    const newItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit: product.unit || 'Adet',
      unit_price: product.price,
      discount_percent: 0,
      vat_rate: product.vat_rate || 20,
    };
    setItems([...items, newItem]);
    setProductModalVisible(false);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * (item.discount_percent / 100);
    const afterDiscount = subtotal - discount;
    const vat = afterDiscount * (item.vat_rate / 100);
    return afterDiscount + vat;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalVat = 0;

    items.forEach((item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      const discount = itemSubtotal * (item.discount_percent / 100);
      const afterDiscount = itemSubtotal - discount;
      const vat = afterDiscount * (item.vat_rate / 100);
      
      subtotal += afterDiscount;
      totalVat += vat;
    });

    return {
      subtotal,
      totalVat,
      total: subtotal + totalVat,
    };
  };

  const toggleBankAccount = (account) => {
    const exists = selectedBankAccounts.find((a) => a.id === account.id);
    if (exists) {
      setSelectedBankAccounts(selectedBankAccounts.filter((a) => a.id !== account.id));
    } else {
      setSelectedBankAccounts([...selectedBankAccounts, account]);
    }
  };

  const handleSubmit = async () => {
    if (!quoteName.trim()) {
      Alert.alert('Hata', 'Teklif adi zorunludur');
      return;
    }
    if (!selectedCustomer) {
      Alert.alert('Hata', 'Lutfen bir musteri secin');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Hata', 'Lutfen en az bir urun/hizmet ekleyin');
      return;
    }

    const totals = calculateTotals();
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + parseInt(validityDays));

    const quoteData = {
      quote_name: quoteName,
      customer_name: selectedCustomer.name,
      customer_email: selectedCustomer.email,
      customer_phone: selectedCustomer.phone,
      customer_address: selectedCustomer.address,
      customer_tax_number: selectedCustomer.tax_number,
      items: items.map((item) => ({
        ...item,
        total: calculateItemTotal(item),
      })),
      bank_accounts: selectedBankAccounts,
      notes,
      validity_date: validityDate.toISOString(),
      subtotal: totals.subtotal,
      total_vat: totals.totalVat,
      total: totals.total,
      status: 'draft',
    };

    setLoading(true);
    try {
      await quotesAPI.create(quoteData);
      Alert.alert('Basarili', 'Teklif olusturuldu', [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Teklif olusturulamadi');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Quote Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teklif Adi *</Text>
          <TextInput
            style={styles.input}
            value={quoteName}
            onChangeText={setQuoteName}
            placeholder="Ornek: ABC Sirketine Web Projesi Teklifi"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Musteri *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setCustomerModalVisible(true)}
          >
            <Ionicons name="person" size={20} color="#64748b" />
            <Text style={[styles.selectorText, !selectedCustomer && styles.placeholder]}>
              {selectedCustomer ? selectedCustomer.name : 'Musteri sec...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Urunler / Hizmetler</Text>
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => setProductModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <View style={styles.itemRow}>
                <View style={styles.itemField}>
                  <Text style={styles.itemLabel}>Miktar</Text>
                  <TextInput
                    style={styles.itemInput}
                    value={item.quantity.toString()}
                    onChangeText={(text) => updateItem(index, 'quantity', parseInt(text) || 0)}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.itemField}>
                  <Text style={styles.itemLabel}>Birim Fiyat</Text>
                  <TextInput
                    style={styles.itemInput}
                    value={item.unit_price.toString()}
                    onChangeText={(text) => updateItem(index, 'unit_price', parseFloat(text) || 0)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.itemField}>
                  <Text style={styles.itemLabel}>Isk. %</Text>
                  <TextInput
                    style={styles.itemInput}
                    value={item.discount_percent.toString()}
                    onChangeText={(text) => updateItem(index, 'discount_percent', parseInt(text) || 0)}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <Text style={styles.itemTotal}>
                Toplam: {formatCurrency(calculateItemTotal(item))}
              </Text>
            </View>
          ))}

          {items.length === 0 && (
            <View style={styles.emptyItems}>
              <Ionicons name="cube-outline" size={32} color="#cbd5e1" />
              <Text style={styles.emptyText}>Henuz urun eklenmedi</Text>
            </View>
          )}
        </View>

        {/* Bank Accounts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Banka Hesaplari</Text>
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => setBankModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {selectedBankAccounts.map((account) => (
            <View key={account.id} style={styles.bankCard}>
              <Text style={styles.bankName}>{account.bank_name}</Text>
              <Text style={styles.bankIban}>{account.iban}</Text>
              <TouchableOpacity
                style={styles.removeBankButton}
                onPress={() => toggleBankAccount(account)}
              >
                <Ionicons name="close" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notlar</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Teklife eklemek istediginiz notlar..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Validity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gecerlilik Suresi (gun)</Text>
          <TextInput
            style={styles.input}
            value={validityDays}
            onChangeText={setValidityDays}
            keyboardType="number-pad"
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Totals & Submit */}
      <View style={styles.footer}>
        <View style={styles.totals}>
          <Text style={styles.totalLabel}>Toplam:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totals.total)}</Text>
        </View>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Teklifi Olustur</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Customer Modal */}
      <Modal visible={customerModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Musteri Sec</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={customers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCustomer(item);
                    setCustomerModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {item.email && <Text style={styles.modalItemSubtext}>{item.email}</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>Musteri bulunamadi</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Product Modal */}
      <Modal visible={productModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Urun/Hizmet Sec</Text>
              <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => addProduct(item)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  <Text style={styles.modalItemPrice}>{formatCurrency(item.price)}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>Urun bulunamadi</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Bank Modal */}
      <Modal visible={bankModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Banka Hesabi Sec</Text>
              <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={bankAccounts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedBankAccounts.find((a) => a.id === item.id) && styles.selectedItem,
                  ]}
                  onPress={() => toggleBankAccount(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemText}>{item.bank_name}</Text>
                    <Text style={styles.modalItemSubtext}>{item.iban}</Text>
                  </View>
                  {selectedBankAccounts.find((a) => a.id === item.id) && (
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>Banka hesabi bulunamadi</Text>
              }
            />
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setBankModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  placeholder: {
    color: '#94a3b8',
  },
  addItemButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  itemField: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  itemInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemTotal: {
    textAlign: 'right',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#f97316',
  },
  emptyItems: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 8,
    color: '#94a3b8',
  },
  bankCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  bankName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  bankIban: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  removeBankButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  totals: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f97316',
  },
  submitButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectedItem: {
    backgroundColor: '#f0fdf4',
  },
  modalItemText: {
    fontSize: 16,
    color: '#0f172a',
  },
  modalItemSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  modalItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f97316',
  },
  emptyModalText: {
    textAlign: 'center',
    padding: 24,
    color: '#94a3b8',
  },
  doneButton: {
    backgroundColor: '#f97316',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NewQuoteScreen;
