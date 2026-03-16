import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { quotesAPI } from '../services/api';
import API_URL from '../config';
import * as SecureStore from 'expo-secure-store';

const QuoteDetailScreen = ({ route, navigation }) => {
  const { quoteId } = route.params;
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      const response = await quotesAPI.getById(quoteId);
      setQuote(response.data);
    } catch (error) {
      console.error('Error fetching quote:', error);
      Alert.alert('Hata', 'Teklif yuklenemedi');
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const pdfUrl = `${API_URL}/quotes/${quoteId}/pdf`;
      
      const downloadResult = await FileSystem.downloadAsync(
        pdfUrl,
        FileSystem.documentDirectory + `teklif_${quote.quote_number}.pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (downloadResult.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Teklifi Paylas',
          });
        } else {
          Alert.alert('Basarili', 'PDF indirildi');
        }
      } else {
        throw new Error('PDF indirilemedi');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      Alert.alert('Hata', 'PDF indirilemedi');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${quote.quote_name || 'Teklif'} - ${quote.quote_number}\nMusteri: ${quote.customer_name}\nToplam: ${formatCurrency(quote.total)}`,
        title: 'Teklif Paylas',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'accepted':
        return 'Kabul Edildi';
      case 'rejected':
        return 'Reddedildi';
      case 'pending':
        return 'Beklemede';
      default:
        return 'Taslak';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (!quote) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Teklif bulunamadi</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.quoteName}>{quote.quote_name || 'Isimsiz Teklif'}</Text>
            <Text style={styles.quoteNumber}>{quote.quote_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quote.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(quote.status) }]}>
              {getStatusText(quote.status)}
            </Text>
          </View>
        </View>
        
        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Olusturma</Text>
            <Text style={styles.dateValue}>{formatDate(quote.created_at)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Gecerlilik</Text>
            <Text style={styles.dateValue}>{formatDate(quote.validity_date)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Musteri Bilgileri</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#64748b" />
            <Text style={styles.infoText}>{quote.customer_name}</Text>
          </View>
          {quote.customer_email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#64748b" />
              <Text style={styles.infoText}>{quote.customer_email}</Text>
            </View>
          )}
          {quote.customer_phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#64748b" />
              <Text style={styles.infoText}>{quote.customer_phone}</Text>
            </View>
          )}
          {quote.customer_address && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#64748b" />
              <Text style={styles.infoText}>{quote.customer_address}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Urunler / Hizmetler</Text>
        {quote.items?.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemDetail}>
                {item.quantity} {item.unit} x {formatCurrency(item.unit_price)}
              </Text>
              {item.discount_percent > 0 && (
                <Text style={styles.itemDiscount}>-%{item.discount_percent} indirim</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.totalsCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Ara Toplam</Text>
          <Text style={styles.totalValue}>{formatCurrency(quote.subtotal)}</Text>
        </View>
        {quote.general_discount_amount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Indirim</Text>
            <Text style={[styles.totalValue, { color: '#10b981' }]}>
              -{formatCurrency(quote.general_discount_amount)}
            </Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>KDV</Text>
          <Text style={styles.totalValue}>{formatCurrency(quote.total_vat)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Genel Toplam</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(quote.total)}</Text>
        </View>
      </View>

      {quote.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notlar</Text>
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.pdfButton]}
          onPress={handleDownloadPDF}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="download" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>PDF Indir</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color="#0f172a" />
          <Text style={[styles.actionButtonText, { color: '#0f172a' }]}>Paylas</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
  },
  headerCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  quoteName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  quoteNumber: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateItem: {},
  dateLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    marginRight: 12,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f97316',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDetail: {
    fontSize: 13,
    color: '#64748b',
  },
  itemDiscount: {
    fontSize: 13,
    color: '#10b981',
  },
  totalsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#f1f5f9',
    marginTop: 8,
    paddingTop: 16,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f97316',
  },
  notesCard: {
    backgroundColor: '#fefce8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  notesText: {
    fontSize: 14,
    color: '#713f12',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  pdfButton: {
    backgroundColor: '#f97316',
  },
  shareButton: {
    backgroundColor: '#f1f5f9',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default QuoteDetailScreen;
