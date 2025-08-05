import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { fetchAssignedServices } from '../../../util/servicesApi';
import { AuthContext } from '../../../store/AuthContext';
import { Job } from '../../../constants/jobTypes';
// import { AssignedService } from '../util/ApiService';  // if you have the type
// src/types/AssignedService.ts

export interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
}

export interface Provider {
  _id: string;
  companyName: string;
  phoneNumber: string;
}

export interface ServiceInfo {
  _id: string;
  name: string;
  category: string;
  basePrice: number;
}

export type AssignedStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'deadline_alert'
  // add other statuses if your backend uses them
  ;






export default function MessageScreen() {
  const [services, setServices] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const {token} = useContext(AuthContext)

  // Replace with your real token retrieval logic

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        setLoading(true);
        const data = await fetchAssignedServices(token, 1, 20);
        if (isMounted) {
          setServices(data);            // data is the array of services
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
          Alert.alert('Error', err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadServices();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: 'red' }}>Failed to load services: {error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={services}
      keyExtractor={item => item._id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={{ marginBottom: 12, padding: 12, borderWidth: 1, borderRadius: 8 }}>
          <Text style={{ fontWeight: 'bold' }}>{item.service.name}</Text>
          <Text>Category: {item.service.category}</Text>
          <Text>Scheduled: {new Date(item.scheduledDate).toLocaleString()}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Notes: {item.notes}</Text>
        </View>
      )}
      ListEmptyComponent={<Text>No assigned services found.</Text>}
    />
  );
}
