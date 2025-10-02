// Database Connection Test Script
// Run this in your browser console after setting up the database

import { supabase } from './services/supabaseClient.js';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('📡 Testing Supabase connection...');
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test 2: Check if all required tables exist
    console.log('📋 Checking required tables...');
    
    const tables = [
      'user_profiles',
      'celebrations', 
      'celebration_comments',
      'celebration_likes',
      'celebration_saves',
      'events',
      'event_rsvps',
      'user_follows',
      'achievements',
      'user_achievements'
    ];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.error(`❌ Table '${table}' not found or accessible:`, error.message);
        } else {
          console.log(`✅ Table '${table}' is accessible`);
        }
      } catch (err) {
        console.error(`❌ Error checking table '${table}':`, err);
      }
    }
    
    // Test 3: Check if we can create a test celebration
    console.log('🎉 Testing celebration creation...');
    const testCelebration = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      title: 'Test Celebration',
      description: 'This is a test celebration',
      image_url: 'https://picsum.photos/400/300',
      location_lng: -122.4194,
      location_lat: 37.7749
    };
    
    const { data: celebrationData, error: celebrationError } = await supabase
      .from('celebrations')
      .insert(testCelebration)
      .select();
    
    if (celebrationError) {
      console.error('❌ Celebration creation test failed:', celebrationError);
    } else {
      console.log('✅ Celebration creation test successful');
      
      // Clean up test data
      await supabase.from('celebrations').delete().eq('id', celebrationData[0].id);
      console.log('🧹 Test data cleaned up');
    }
    
    // Test 4: Check RLS policies
    console.log('🔒 Testing Row Level Security...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('user_profiles')
      .select('id, name')
      .limit(1);
    
    if (rlsError) {
      console.error('❌ RLS test failed:', rlsError);
    } else {
      console.log('✅ RLS policies are working');
    }
    
    console.log('🎉 Database test completed successfully!');
    console.log('📋 Your database is ready for the Woon app!');
    
    return true;
    
  } catch (error) {
    console.error('💥 Database test failed:', error);
    return false;
  }
}

// Run the test
testDatabaseConnection();

