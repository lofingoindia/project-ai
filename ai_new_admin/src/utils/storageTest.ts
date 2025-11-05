import { supabase } from '../lib/supabase';

// Storage bucket test utility
export const testStorageBucket = async () => {
  const results = {
    bucketExists: false,
    bucketAccessible: false,
    policies: {
      canRead: false,
      canUpload: false
    },
    error: null as string | null
  };

  try {
    console.log('🔄 Testing product-media storage bucket...');

    // Test 1: Check if bucket exists by listing files
    try {
      const { error } = await supabase.storage
        .from('product-media')
        .list('', { limit: 1 });

      if (error) {
        results.error = error.message;
        console.error('❌ Bucket access failed:', error.message);
      } else {
        results.bucketExists = true;
        results.bucketAccessible = true;
        console.log('✅ Bucket exists and is accessible');
      }
    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Bucket test failed:', error);
    }

    // Test 2: Check public read access
    if (results.bucketAccessible) {
      try {
        const { data } = supabase.storage
          .from('product-media')
          .getPublicUrl('test-path/test-file.jpg');
        
        if (data.publicUrl) {
          results.policies.canRead = true;
          console.log('✅ Public read access available');
        }
      } catch (error) {
        console.warn('⚠️  Public read test failed:', error);
      }
    }

    // Test 3: Check authentication status
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.warn('⚠️  Auth check failed:', authError.message);
      } else if (user) {
        console.log('✅ User authenticated:', user.email);
        results.policies.canUpload = true;
      } else {
        console.warn('⚠️  No authenticated user');
      }
    } catch (error) {
      console.warn('⚠️  Auth test failed:', error);
    }

    return results;
  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Storage test failed:', error);
    return results;
  }
};

// Test file upload without actually uploading
export const testUploadCapability = async () => {
  try {
    console.log('🔄 Testing upload capability...');
    
    // Create a small test blob
    const testBlob = new Blob(['test content'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
    
    const fileName = `test-uploads/capability-test-${Date.now()}.txt`;
    
    const { error } = await supabase.storage
      .from('product-media')
      .upload(fileName, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload capability test failed:', error.message);
      return { canUpload: false, error: error.message };
    }

    console.log('✅ Upload capability confirmed');
    
    // Clean up test file
    try {
      await supabase.storage
        .from('product-media')
        .remove([fileName]);
      console.log('✅ Test file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️  Test file cleanup failed:', cleanupError);
    }

    return { canUpload: true, error: null };
  } catch (error) {
    console.error('❌ Upload capability test failed:', error);
    return { 
      canUpload: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Generate storage diagnostic report
export const generateStorageDiagnostic = async () => {
  console.log('🔍 Running storage diagnostic...');
  
  const bucketTest = await testStorageBucket();
  const uploadTest = await testUploadCapability();
  
  const report = {
    timestamp: new Date().toISOString(),
    bucket: bucketTest,
    upload: uploadTest,
    recommendations: [] as string[]
  };

  // Generate recommendations
  if (!bucketTest.bucketExists) {
    report.recommendations.push('Create the "product-media" storage bucket in Supabase Dashboard');
  }
  
  if (!bucketTest.policies.canRead) {
    report.recommendations.push('Add public read policy for the product-media bucket');
  }
  
  if (!bucketTest.policies.canUpload) {
    report.recommendations.push('Ensure user is authenticated for upload permissions');
  }
  
  if (!uploadTest.canUpload) {
    report.recommendations.push('Check storage policies for authenticated upload permissions');
  }

  console.log('📊 Storage Diagnostic Report:', report);
  return report;
};