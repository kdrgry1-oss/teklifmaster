import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { quotesAPI } from '../services/api';

const QuotesScreen = ({ navigation }) => {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async () => {
    try {
      const response = await quotesAPI.getAll();
      setQuotes(response.data);
      setFilteredQuotes(response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      Alert.alert('Hata', 'Teklifler yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchQuotes();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = quotes.filter(
        (q) =>
          q.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.quote_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredQuotes(filtered);
    } else {
      setFilteredQuotes(quotes);
    }
  }, [searchQuery, quotes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQuotes();
    setRefreshing(false);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.quoteCard}
      onPress={() => navigation.navigate('QuoteDetail', { quoteId: item.id })}
    >
      <View style={styles.quoteHeader}>
        <View>
          <Text style={styles.quoteName}>{item.quote_name || 'Isimsiz Teklif'}</Text>
          <Text style={styles.quoteNumber}>{item.quote_number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.quoteInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#64748b" />
          <Text style={styles.infoText}>{item.customer_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#64748b" />
          <Text style={styles.infoText}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
      
      <View style={styles.quoteFooter}>
        <Text style={styles.totalLabel}>Toplam:</Text>
        <Text style={styles.totalAmount}>{formatCurrency(item.total)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teklifler</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('NewQuote')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Teklif ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#64748b" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredQuotes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>
              {loading ? 'Yukleniyor...' : 'Henuz teklif bulunmuyor'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#0f172a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#0f172a',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  quoteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quoteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  quoteNumber: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quoteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#64748b',
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f97316',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94a3b8',
  },
});

export default QuotesScreen;
