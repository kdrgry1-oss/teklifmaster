import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount || 0);
  };

  const StatCard = ({ icon, title, value, color, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Merhaba,</Text>
        <Text style={styles.companyName}>{user?.company_name || 'Kullanıcı'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="document-text"
          title="Teklifler"
          value={stats?.total_quotes || 0}
          color="#f97316"
          onPress={() => navigation.navigate('Quotes')}
        />
        <StatCard
          icon="people"
          title="Müşteriler"
          value={stats?.total_customers || 0}
          color="#3b82f6"
          onPress={() => navigation.navigate('Customers')}
        />
        <StatCard
          icon="cube"
          title="Ürünler"
          value={stats?.total_products || 0}
          color="#10b981"
          onPress={() => navigation.navigate('Products')}
        />
        <StatCard
          icon="cash"
          title="Toplam"
          value={formatCurrency(stats?.total_amount)}
          color="#8b5cf6"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('NewQuote')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#f9731620' }]}>
            <Ionicons name="add-circle" size={24} color="#f97316" />
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Yeni Teklif Oluştur</Text>
            <Text style={styles.quickActionSubtitle}>Hızlıca profesyonel teklif hazırla</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('Products')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#10b98120' }]}>
            <Ionicons name="cube" size={24} color="#10b981" />
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Ürün/Hizmet Ekle</Text>
            <Text style={styles.quickActionSubtitle}>Kataloğuna yeni ürün ekle</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('Customers')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#3b82f620' }]}>
            <Ionicons name="person-add" size={24} color="#3b82f6" />
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Müşteri Ekle</Text>
            <Text style={styles.quickActionSubtitle}>Yeni müşteri kaydı oluştur</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {stats?.subscription_status === 'trial' && (
        <View style={styles.trialBanner}>
          <Ionicons name="time" size={24} color="#f97316" />
          <View style={styles.trialContent}>
            <Text style={styles.trialTitle}>Deneme Sürümü</Text>
            <Text style={styles.trialSubtitle}>
              {stats?.trial_days_left || 0} gün kaldı
            </Text>
          </View>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Yükselt</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#0f172a',
  },
  greeting: {
    fontSize: 16,
    color: '#94a3b8',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    marginTop: -30,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: '1%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statTitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
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
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionContent: {
    flex: 1,
    marginLeft: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  trialContent: {
    flex: 1,
    marginLeft: 12,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9a3412',
  },
  trialSubtitle: {
    fontSize: 13,
    color: '#c2410c',
  },
  upgradeButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default DashboardScreen;
