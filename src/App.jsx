import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Camera, Heart, ImagePlus, Trash2, X, LoaderCircle, Sparkles } from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const BUCKET = "friend-photos";
const MAX_SIZE = 8 * 1024 * 1024;

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [userId, setUserId] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    let alive = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      let user = sessionData.session?.user;
      if (!user) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        user = data.user;
      }
      if (alive) {
        setUserId(user.id);
        await loadPhotos();
        setReady(true);
      }
    })().catch((error) => {
      console.error(error);
      if (alive) {
        setNotice("Could not connect to the photo album. Check your Supabase setup.");
        setReady(true);
      }
    });
    return () => { alive = false; };
  }, []);

  async function loadPhotos() {
    const { data, error } = await supabase
      .from("photos")
      .select("id, storage_path, caption, created_at, owner_id")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setPhotos((data || []).map((photo) => ({
      ...photo,
      url: supabase.storage.from(BUCKET).getPublicUrl(photo.storage_path).data.publicUrl
    })));
  }

  async function uploadFiles(fileList) {
    if (!supabase) {
      setNotice("Setup needed: add your Supabase URL and anon key to the .env file.");
      return;
    }
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setBusy(true);
    setNotice("");
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          setNotice(`${file.name} is not an image, so it was skipped.`);
          continue;
        }
        if (file.size > MAX_SIZE) {
          setNotice(`${file.name} is larger than 8 MB, so it was skipped.`);
          continue;
        }
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
        const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600", upsert: false, contentType: file.type
        });
        if (uploadError) throw uploadError;
        const { error: insertError } = await supabase.from("photos").insert({
          storage_path: path, caption: file.name, owner_id: userId
        });
        if (insertError) {
          await supabase.storage.from(BUCKET).remove([path]);
          throw insertError;
        }
      }
      await loadPhotos();
      setNotice("Photo upload complete!");
    } catch (error) {
      console.error(error);
      setNotice(error.message || "Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deletePhoto(photo) {
    if (!supabase || photo.owner_id !== userId) return;
    if (!window.confirm("Delete this photo? This cannot be undone.")) return;
    setBusy(true);
    setNotice("");
    try {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([photo.storage_path]);
      if (storageError) throw storageError;
      const { error: rowError } = await supabase.from("photos").delete().eq("id", photo.id);
      if (rowError) throw rowError;
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      if (selected?.id === photo.id) setSelected(null);
      setNotice("Photo deleted.");
    } catch (error) {
      console.error(error);
      setNotice(error.message || "Could not delete this photo.");
    } finally {
      setBusy(false);
    }
  }

  const setupMissing = !supabase;

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#" aria-label="Friend Zone home">
          <span className="brand-mark"><Heart size={18} fill="currentColor" /></span>
          <span>FRIEND ZONE</span>
        </a>
        <span className="top-note">MEMORIES LIVE FOREVER</span>
      </header>

      <section className="hero">
        <div className="hero-orb orb-one" />
        <div className="hero-orb orb-two" />
        <div className="hero-content">
          <div className="eyebrow"><Sparkles size={14} /> OUR LITTLE MEMORY SPACE</div>
          <h1>2016 <span>to</span> Infinity<span className="pink-dot">.</span></h1>
          <p>Every photo holds a story. Every story brings us back together.</p>
          <button className="upload-button" onClick={() => fileRef.current?.click()} disabled={!ready || busy}>
            {busy ? <LoaderCircle className="spin" size={18} /> : <ImagePlus size={18} />}
            {busy ? "Please wait..." : "Add your photos"}
          </button>
          <input
            ref={fileRef}
            className="hidden-input"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => uploadFiles(event.target.files)}
          />
          <div className="hero-foot"><Camera size={15} /> A collection of moments, made together</div>
        </div>
        <div className="hero-decoration">♡</div>
      </section>

      <section className="gallery-wrap">
        <div className="gallery-heading">
          <div>
            <div className="section-kicker">THE GOOD OLD DAYS & THE NEW ONES</div>
            <h2>Our memories <span>♡</span></h2>
          </div>
          <div className="photo-count">{photos.length} {photos.length === 1 ? "PHOTO" : "PHOTOS"}</div>
        </div>

        {notice && <div className="notice" role="status">{notice}</div>}
        {setupMissing && (
          <div className="setup-warning">
            <strong>One setup step left.</strong> Add your Supabase project URL and anon key to the <code>.env</code> file, then restart the app. See README.md.
          </div>
        )}

        {!ready ? (
          <div className="empty-state"><LoaderCircle className="spin" size={28} /><p>Opening our album...</p></div>
        ) : photos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ImagePlus size={28} /></div>
            <h3>Our story starts here</h3>
            <p>Upload the first photo and start collecting memories.</p>
            <button className="text-button" onClick={() => fileRef.current?.click()}>Choose a photo <span>→</span></button>
          </div>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <article className="photo-card" key={photo.id}>
                <button className="photo-open" onClick={() => setSelected(photo)} aria-label="View photo">
                  <img src={photo.url} alt={photo.caption || "Friend Zone memory"} loading="lazy" />
                </button>
                <div className="photo-meta">
                  <span>{new Date(photo.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                  {photo.owner_id === userId && (
                    <button className="delete-button" onClick={() => deletePhoto(photo)} disabled={busy} aria-label="Delete your photo" title="Delete your photo">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer><Heart size={14} fill="currentColor" /> FRIEND ZONE <span>·</span> 2016 TO INFINITY</footer>

      {selected && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <button className="close-lightbox" onClick={() => setSelected(null)} aria-label="Close"><X /></button>
          <img src={selected.url} alt={selected.caption || "Memory"} onClick={(event) => event.stopPropagation()} />
          <div className="lightbox-date">{new Date(selected.created_at).toLocaleDateString()}</div>
          {selected.owner_id === userId && (
            <button className="lightbox-delete" onClick={() => deletePhoto(selected)}><Trash2 size={16} /> Delete photo</button>
          )}
        </div>
      )}
    </main>
  );
}