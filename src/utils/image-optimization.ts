import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

interface OptimizedImage {
  uri: string;
  width: number;
  height: number;
  size: number;
}

class ImageOptimizer {
  // Default settings for different use cases
  private static readonly PRESETS = {
    thumbnail: {
      maxWidth: 200,
      maxHeight: 200,
      quality: 0.7,
      format: 'jpeg' as const,
    },
    preview: {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
      format: 'jpeg' as const,
    },
    fullSize: {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.9,
      format: 'jpeg' as const,
    },
    progressPhoto: {
      maxWidth: 1200,
      maxHeight: 1600,
      quality: 0.85,
      format: 'jpeg' as const,
    },
  };

  /**
   * Optimize an image with custom options
   */
  static async optimize(
    imageUri: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.8,
      format = 'jpeg',
    } = options;

    try {
      // Get original image info
      const originalInfo = await FileSystem.getInfoAsync(imageUri);
      if (!originalInfo.exists) {
        throw new Error('Image file not found');
      }

      // Manipulate image
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        {
          compress: quality,
          format: format === 'jpeg' 
            ? ImageManipulator.SaveFormat.JPEG 
            : ImageManipulator.SaveFormat.PNG,
        }
      );

      // Get optimized image info
      const optimizedInfo = await FileSystem.getInfoAsync(manipResult.uri);

      return {
        uri: manipResult.uri,
        width: manipResult.width,
        height: manipResult.height,
        size: optimizedInfo.exists ? optimizedInfo.size || 0 : 0,
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw error;
    }
  }

  /**
   * Create a thumbnail from an image
   */
  static async createThumbnail(imageUri: string): Promise<OptimizedImage> {
    return this.optimize(imageUri, this.PRESETS.thumbnail);
  }

  /**
   * Create a preview image (medium size)
   */
  static async createPreview(imageUri: string): Promise<OptimizedImage> {
    return this.optimize(imageUri, this.PRESETS.preview);
  }

  /**
   * Optimize for progress photos
   */
  static async optimizeProgressPhoto(imageUri: string): Promise<{
    full: OptimizedImage;
    thumbnail: OptimizedImage;
  }> {
    const [full, thumbnail] = await Promise.all([
      this.optimize(imageUri, this.PRESETS.progressPhoto),
      this.createThumbnail(imageUri),
    ]);

    return { full, thumbnail };
  }

  /**
   * Calculate size reduction percentage
   */
  static calculateSizeReduction(originalSize: number, optimizedSize: number): number {
    return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Batch optimize multiple images
   */
  static async batchOptimize(
    imageUris: string[],
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage[]> {
    const optimizedImages = await Promise.all(
      imageUris.map(uri => this.optimize(uri, options))
    );

    return optimizedImages;
  }

  /**
   * Get image dimensions without loading the full image
   */
  static async getImageDimensions(imageUri: string): Promise<{ width: number; height: number }> {
    try {
      // This is a lightweight way to get dimensions
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );

      return {
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Failed to get image dimensions:', error);
      throw error;
    }
  }

  /**
   * Check if image needs optimization based on size
   */
  static async needsOptimization(
    imageUri: string,
    maxSizeBytes: number = 1024 * 1024 // 1MB default
  ): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(imageUri);
      return info.exists && (info.size || 0) > maxSizeBytes;
    } catch (error) {
      console.error('Failed to check image size:', error);
      return false;
    }
  }

  /**
   * Smart optimization - only optimize if needed
   */
  static async smartOptimize(
    imageUri: string,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const needsOpt = await this.needsOptimization(imageUri);
    
    if (!needsOpt) {
      const dimensions = await this.getImageDimensions(imageUri);
      const info = await FileSystem.getInfoAsync(imageUri);
      
      return {
        uri: imageUri,
        width: dimensions.width,
        height: dimensions.height,
        size: info.exists ? info.size || 0 : 0,
      };
    }

    return this.optimize(imageUri, options);
  }
}

export default ImageOptimizer;
export type { ImageOptimizationOptions, OptimizedImage };