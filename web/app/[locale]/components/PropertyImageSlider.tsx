'use client';

import { useState, useEffect } from 'react';

export interface PropertyImage {
  url: string;
  file?: File;
}

interface PropertyImageSliderProps {
  images: PropertyImage[];
  alt: string;
  editable?: boolean;
  onChange?: (images: PropertyImage[]) => void;
}

export function PropertyImageSlider({ images: initialImages, alt, editable = false, onChange }: PropertyImageSliderProps) {
  const [images, setImages] = useState<PropertyImage[]>([{ url: '/default-property.png' }]);
  const [currentImage, setCurrentImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setImages(initialImages);
    }
  }, [initialImages]);

  const addImages = (files: File[]) => {
    const newImages = files.map(file => ({
      url: URL.createObjectURL(file),
      file,
    }));

    let updatedImages = images;
    if (images.length === 1 && images[0].url === '/default-property.png') {
      updatedImages = newImages;
    } else {
      updatedImages = [...images, ...newImages];
    }

    setImages(updatedImages);
    onChange?.(updatedImages);
  };

  const removeImage = (index: number) => {
    let updatedImages = images.filter((_, i) => i !== index);

    if (updatedImages.length === 0) {
      setImages([{ url: '/default-property.png' }]);
      onChange?.([]);
      setCurrentImage(0);
      return;
    }

    if (currentImage >= updatedImages.length) {
      setCurrentImage(updatedImages.length - 1);
    }

    setImages(updatedImages);
    onChange?.(updatedImages);
  };

  const getImageSrc = (img: PropertyImage) => {
    if (!img || !img.url) return '/default-property.png';
    return img.url;
  };

  const totalImages = images.length;
  const nextImage = () => setCurrentImage(prev => (prev + 1) % totalImages);
  const prevImage = () => setCurrentImage(prev => (prev - 1 + totalImages) % totalImages);

  return (
    <div className="relative w-full mb-6">
      {totalImages > 0 && (
        <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl cursor-zoom-in">
          <img
            src={getImageSrc(images[currentImage])}
            alt={alt}
            className="w-full h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[90vh] object-cover object-center transition-transform duration-700 ease-in-out"
            onClick={() => setIsModalOpen(true)}
          />

          {totalImages > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-3 rounded-full transition">
                ◀
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white p-3 rounded-full transition">
                ▶
              </button>
            </>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col justify-center items-center p-4">
          <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-white text-3xl font-bold z-50 hover:text-yellow-400 transition">
            ×
          </button>

          <div className="relative w-full max-w-6xl">
            <img src={getImageSrc(images[currentImage])} alt={alt} className="w-full h-[80vh] object-contain object-center" />
            {totalImages > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition">
                  ◀
                </button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition">
                  ▶
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto max-w-full">
            {images.map((img, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img
                  src={getImageSrc(img)}
                  className={`w-20 h-20 object-cover rounded border cursor-pointer transition-transform ${i === currentImage ? 'border-yellow-500 scale-105' : 'border-gray-300'}`}
                  onClick={() => setCurrentImage(i)}
                />
                {editable && (
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 hover:bg-red-600 transition">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {editable && (
        <div className="mt-4">
          <label className="block font-semibold mb-2 text-gray-900">Imágenes</label>
          <div
            className="border-2 border-dashed border-yellow-400 p-6 rounded text-center cursor-pointer hover:bg-yellow-50 transition"
            onDragOver={e => e.preventDefault()}
            onDrop={e => addImages(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')))}
            onClick={() => document.getElementById('images')?.click()}
          >
            Arrastra o haz click para añadir imágenes
          </div>
          <input type="file" id="images" multiple accept="image/*" className="hidden" onChange={e => e.target.files && addImages(Array.from(e.target.files))} />

          <div className="flex flex-wrap gap-2 mt-2">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img src={getImageSrc(img)} className="w-24 h-24 object-cover rounded border cursor-pointer" onClick={() => setCurrentImage(i)} />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 hover:bg-red-600 transition">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
