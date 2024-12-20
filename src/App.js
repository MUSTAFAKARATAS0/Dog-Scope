import React, { useState, useRef, useReducer } from "react"; 
import * as mobilenet from "@tensorflow-models/mobilenet"; 
import "./App.css"; 

// Bu dosya, Mobilenet modelini kullanarak yüklenen bir resimdeki objeleri sınıflandıran bir React uygulamasını içerir.
// Kullanıcı, modeli yükleyebilir, bir resim seçebilir ve sonuçları görebilir.

// Durum makinesi, uygulamanın farklı durumlarını ve bu durumlarda yapılabilecek işlemleri tanımlar.
const machine = {
  initial: "initial", // Başlangıç durumu
  states: {
    initial: { on: { next: "loadingModel" } }, // Başlangıçtan model yükleme durumuna geçiş
    loadingModel: { on: { next: "modelReady" } }, // Model yükleniyor
    modelReady: { on: { next: "imageReady" } }, // Model hazır
    imageReady: { on: { next: "identifying" }, showImage: true }, // Resim yüklendi, gösteriliyor
    identifying: { on: { next: "complete" } }, // Sınıflandırma yapılıyor
    complete: { 
      on: { next: "modelReady" }, 
      showImage: true, // Resim gösteriliyor
      showResults: true // Sonuçlar gösteriliyor
    }
  }
};

function App() {
  // React state'leri ve referansları
  const [results, setResults] = useState([]); // Sınıflandırma sonuçlarını tutar
  const [imageURL, setImageURL] = useState(null); // Yüklenen resmin URL'sini tutar
  const [model, setModel] = useState(null); // Mobilenet modelini tutar
  const imageRef = useRef(); // Resim öğesine referans
  const inputRef = useRef(); // Dosya yükleme girişine referans

  // State yönetimi için bir reducer kullanılıyor
  const reducer = (state, event) =>
    machine.states[state].on[event] || machine.initial;

  const [appState, dispatch] = useReducer(reducer, machine.initial); // Başlangıç durumu
  const next = () => dispatch("next"); // Bir sonraki duruma geçiş

  // Mobilenet modelini yükleme
  const loadModel = async () => {
    next(); // Durumu "loadingModel" yapar
    const model = await mobilenet.load(); // Model yükleniyor
    setModel(model); // Model state'e atanıyor
    next(); // Durumu "modelReady" yapar
  };

  // Yüklenen resmi sınıflandırma
  const identify = async () => {
    next(); // Durumu "identifying" yapar
    const results = await model.classify(imageRef.current); // Resmi sınıflandırır
    setResults(results); // Sonuçları state'e kaydeder
    next(); // Durumu "complete" yapar
  };

  // Uygulamayı sıfırlama
  const reset = async () => {
    setResults([]); // Sonuçları temizler
    next(); // Durumu "modelReady" yapar
  };

  // Resim yükleme
  const upload = () => inputRef.current.click(); // Dosya seçimini tetikler

  const handleUpload = event => {
    const { files } = event.target; // Yüklenen dosyalar
    if (files.length > 0) { // Eğer dosya varsa
      const url = URL.createObjectURL(event.target.files[0]); // Geçici URL oluştur
      setImageURL(url); // URL'i state'e ata
      next(); // Durumu "imageReady" yapar
    }
  };

  // Her durum için uygun buton işlemleri ve metinleri
  const actionButton = {
    initial: { action: loadModel, text: "Modeli Yükle" },
    loadingModel: { text: "Model Yükleniyor..." },
    modelReady: { action: upload, text: "Fotoğraf yükle" },
    imageReady: { action: identify, text: "Sınıflandır" },
    identifying: { text: "Sınıflandırılıyor..." },
    complete: { action: reset, text: "Tekrar" }
  };

  const { showImage, showResults } = machine.states[appState]; // Mevcut durumda resim veya sonuç gösterilecek mi?

  return (
    <div>
      {/* Resim gösterimi */}
      {showImage && <img src={imageURL} alt="upload-preview" ref={imageRef} />}
      
      {/* Dosya yükleme input'u */}
      <input
        type="file"
        accept="image/*"
        capture="camera" // Kamera ile çekim yapma desteği
        onChange={handleUpload} // Dosya yüklendiğinde çalışır
        ref={inputRef}
      />
      
      {/* Sonuç listesi */}
      {showResults && (
        <ul>
          {results.map(({ className, probability }) => (
            <li key={className}>
              {`${className}: %${(probability * 100).toFixed(2)}`} {/* Sınıf adı ve olasılığı */}
            </li>
          ))}
        </ul>
      )}
      
      {/* Duruma göre buton */}
      <button onClick={actionButton[appState].action || (() => {})}>
        {actionButton[appState].text}
      </button>
    </div>
  );
}

export default App; // Uygulamayı dışa aktarır
