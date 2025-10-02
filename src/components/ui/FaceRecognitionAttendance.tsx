import { useState, useRef, useEffect } from "react";
import { Camera, StopCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { extractFaceEmbedding, loadImage, compareFaces } from "@/utils/faceRecognition";

interface Student {
  id: string;
  index_number: string;
  profiles: { full_name: string } | null;
}

const FaceRecognitionAttendance = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recognizedStudents, setRecognizedStudents] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);
      toast.success("Camera started");
    } catch (error) {
      toast.error("Failed to access camera");
      console.error(error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setProcessing(true);
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.drawImage(video, 0, 0);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg');
      });
      
      // Load image and extract embedding
      const img = await loadImage(blob);
      const embedding = await extractFaceEmbedding(img);
      
      // Get all student embeddings from database
      const { data: storedEmbeddings, error } = await supabase
        .from('student_face_embeddings')
        .select('student_id, embedding, students(id, index_number, profiles(full_name))');
      
      if (error) throw error;
      
      // Find best match
      let bestMatch: any = null;
      let bestSimilarity = 0;
      const threshold = 0.7; // Similarity threshold
      
      for (const stored of storedEmbeddings || []) {
        const similarity = compareFaces(embedding, stored.embedding);
        if (similarity > bestSimilarity && similarity > threshold) {
          bestSimilarity = similarity;
          bestMatch = stored;
        }
      }
      
      if (bestMatch) {
        // Mark attendance
        const today = new Date().toISOString().split('T')[0];
        const { error: attendanceError } = await supabase
          .from('attendance')
          .upsert({
            student_id: bestMatch.student_id,
            date: today,
            status: 'present',
            remarks: `Auto-marked via facial recognition (${(bestSimilarity * 100).toFixed(1)}% match)`
          }, {
            onConflict: 'student_id,date'
          });
        
        if (attendanceError) throw attendanceError;
        
        const studentName = bestMatch.students?.profiles?.full_name || 'Unknown';
        setRecognizedStudents(prev => [...prev, studentName]);
        toast.success(`Attendance marked for ${studentName}`);
      } else {
        toast.error("No matching student found");
      }
    } catch (error) {
      toast.error("Failed to process image");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Facial Recognition Attendance</CardTitle>
        <CardDescription>Use camera to automatically mark attendance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative bg-muted rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ display: isCapturing ? 'block' : 'none' }}
          />
          {!isCapturing && (
            <div className="flex items-center justify-center h-full">
              <Camera className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
        
        <div className="flex gap-2">
          {!isCapturing ? (
            <Button onClick={startCamera} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          ) : (
            <>
              <Button onClick={stopCamera} variant="secondary" className="flex-1">
                <StopCircle className="mr-2 h-4 w-4" />
                Stop Camera
              </Button>
              <Button 
                onClick={captureAndRecognize} 
                disabled={processing}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {processing ? "Processing..." : "Capture & Mark"}
              </Button>
            </>
          )}
        </div>
        
        {recognizedStudents.length > 0 && (
          <div className="mt-4 p-4 bg-secondary/10 rounded-lg">
            <h3 className="font-semibold mb-2">Recently Marked ({recognizedStudents.length})</h3>
            <ul className="space-y-1">
              {recognizedStudents.slice(-5).map((name, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FaceRecognitionAttendance;
