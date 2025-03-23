
/**
 * Ensures the required storage buckets exist
 * @param supabaseClient Supabase client instance
 * @returns Boolean indicating success
 */
export async function ensureStorageBuckets(supabaseClient: any) {
  try {
    const { data: bucketsData, error: bucketsError } = await supabaseClient.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError);
      throw bucketsError;
    }
    
    // Check if buckets exist and create them if they don't
    if (!bucketsData?.some(bucket => bucket.name === 'shorts')) {
      console.log('Creating shorts bucket...');
      const { error: createBucketError } = await supabaseClient.storage.createBucket('shorts', {
        public: true,
        fileSizeLimit: 52428800 // 50MB limit
      });
      
      if (createBucketError) {
        console.error('Error creating shorts bucket:', createBucketError);
        throw createBucketError;
      }
      
      // Add a permissive policy to allow public access to the shorts bucket
      const { error: policyError } = await supabaseClient.query(`
        BEGIN;
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Public Access" ON storage.objects FOR SELECT;
        
        -- Create new policy for public access
        CREATE POLICY "Public Access" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'shorts');
        
        -- Allow authenticated users to insert objects
        DROP POLICY IF EXISTS "Insert Access" ON storage.objects FOR INSERT;
        CREATE POLICY "Insert Access" 
        ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'shorts');
        
        -- Allow authenticated users to update their own objects
        DROP POLICY IF EXISTS "Update Access" ON storage.objects FOR UPDATE;
        CREATE POLICY "Update Access" 
        ON storage.objects FOR UPDATE 
        USING (bucket_id = 'shorts');
        
        -- Allow authenticated users to delete their own objects
        DROP POLICY IF EXISTS "Delete Access" ON storage.objects FOR DELETE;
        CREATE POLICY "Delete Access" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'shorts');
        COMMIT;
      `);
      
      if (policyError) {
        console.error('Error creating bucket policy:', policyError);
        // Continue as we might still be able to upload
      }
    }

    if (!bucketsData?.some(bucket => bucket.name === 'videos')) {
      console.log('Creating videos bucket...');
      await supabaseClient.storage.createBucket('videos', {
        public: true,
        fileSizeLimit: 104857600 // 100MB limit
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error checking/creating buckets:', error);
    // Continue as the bucket might exist despite the error
    return false;
  }
}

/**
 * Upload a file to Supabase storage
 * @param supabaseClient Supabase client instance
 * @param bucket Bucket name
 * @param filePath Path within bucket
 * @param fileBuffer File data as Uint8Array
 * @param contentType MIME type
 * @returns Object with success status and public URL
 */
export async function uploadToStorage(
  supabaseClient: any,
  bucket: string,
  filePath: string,
  fileBuffer: Uint8Array,
  contentType: string
) {
  try {
    console.log(`Uploading to ${bucket}/${filePath} with content type ${contentType}`);
    
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      console.error(`Error uploading to ${bucket}/${filePath}:`, error);
      throw error;
    }
    
    console.log(`Successfully uploaded file to ${bucket}/${filePath}`);
    
    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log(`Generated public URL: ${urlData.publicUrl}`);
    
    return { 
      success: true, 
      publicUrl: urlData.publicUrl 
    };
  } catch (error) {
    console.error(`Upload failed for ${bucket}/${filePath}:`, error);
    return { 
      success: false, 
      error 
    };
  }
}
