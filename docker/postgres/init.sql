--
-- PostgreSQL database dump
--


-- Dumped from database version 15.19 (Homebrew)
-- Dumped by pg_dump version 15.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: prisma_contract; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA prisma_contract;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contract; Type: TABLE; Schema: prisma_contract; Owner: -
--

CREATE TABLE prisma_contract.contract (
    core_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    contract_json jsonb NOT NULL
);


--
-- Name: ledger; Type: TABLE; Schema: prisma_contract; Owner: -
--

CREATE TABLE prisma_contract.ledger (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    space text NOT NULL,
    migration_name text NOT NULL,
    migration_hash text NOT NULL,
    origin_core_hash text,
    origin_profile_hash text,
    destination_core_hash text NOT NULL,
    destination_profile_hash text,
    operations jsonb NOT NULL
);


--
-- Name: ledger_id_seq; Type: SEQUENCE; Schema: prisma_contract; Owner: -
--

CREATE SEQUENCE prisma_contract.ledger_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ledger_id_seq; Type: SEQUENCE OWNED BY; Schema: prisma_contract; Owner: -
--

ALTER SEQUENCE prisma_contract.ledger_id_seq OWNED BY prisma_contract.ledger.id;


--
-- Name: marker; Type: TABLE; Schema: prisma_contract; Owner: -
--

CREATE TABLE prisma_contract.marker (
    space text DEFAULT 'app'::text NOT NULL,
    core_hash text NOT NULL,
    profile_hash text NOT NULL,
    contract_json jsonb,
    canonical_version integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    app_tag text,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    invariants text[] DEFAULT '{}'::text[] NOT NULL
);


--
-- Name: abonnement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.abonnement (
    date_debut timestamp with time zone NOT NULL,
    date_fin timestamp with time zone NOT NULL,
    formule_id text NOT NULL,
    id text NOT NULL,
    statut text NOT NULL,
    utilisateur_id text NOT NULL
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    action text NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    id text NOT NULL,
    informations_complementaires text,
    utilisateur_id text
);


--
-- Name: conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation (
    date_creation timestamp with time zone DEFAULT now() NOT NULL,
    id text NOT NULL,
    professionnel_id text NOT NULL,
    statut text NOT NULL,
    voyageur_id text NOT NULL
);


--
-- Name: document_echange; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_echange (
    conversation_id text NOT NULL,
    date_envoi timestamp with time zone DEFAULT now() NOT NULL,
    expediteur_id text NOT NULL,
    fichier text NOT NULL,
    id text NOT NULL
);


--
-- Name: document_verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_verification (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    fichier text NOT NULL,
    id text NOT NULL,
    professionnel_id text NOT NULL,
    statut text NOT NULL,
    type_document text NOT NULL
);


--
-- Name: formule_abonnement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.formule_abonnement (
    duree text NOT NULL,
    id text NOT NULL,
    nom text NOT NULL,
    prix integer NOT NULL,
    statut text NOT NULL,
    type_utilisateur text NOT NULL
);


--
-- Name: message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message (
    contenu text NOT NULL,
    conversation_id text NOT NULL,
    date_envoi timestamp with time zone DEFAULT now() NOT NULL,
    expediteur_id text NOT NULL,
    id text NOT NULL,
    statut text NOT NULL
);


--
-- Name: paiement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paiement (
    abonnement_id text NOT NULL,
    date_confirmation timestamp with time zone,
    date_creation timestamp with time zone DEFAULT now() NOT NULL,
    id text NOT NULL,
    montant integer NOT NULL,
    moyen_paiement text NOT NULL,
    reference text NOT NULL,
    statut text NOT NULL
);


--
-- Name: professionnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professionnel (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    id text NOT NULL,
    informations_professionnelles text,
    nom_structure text NOT NULL,
    statut_verification text NOT NULL,
    utilisateur_id text NOT NULL
);


--
-- Name: publication; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publication (
    contenu text NOT NULL,
    date_creation timestamp with time zone DEFAULT now() NOT NULL,
    date_publication timestamp with time zone,
    id text NOT NULL,
    professionnel_id text NOT NULL,
    statut text NOT NULL,
    titre text NOT NULL
);


--
-- Name: signalement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signalement (
    cible_id text NOT NULL,
    date_creation timestamp with time zone DEFAULT now() NOT NULL,
    description text NOT NULL,
    id text NOT NULL,
    motif text NOT NULL,
    statut text NOT NULL,
    type_cible text NOT NULL,
    utilisateur_id text NOT NULL
);


--
-- Name: utilisateur; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utilisateur (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email text NOT NULL,
    id text NOT NULL,
    mot_de_passe text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    role text NOT NULL,
    statut text NOT NULL,
    telephone text
);


--
-- Name: verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification (
    commentaire text,
    date_debut timestamp with time zone DEFAULT now() NOT NULL,
    date_decision timestamp with time zone,
    id text NOT NULL,
    professionnel_id text NOT NULL,
    statut text NOT NULL
);


--
-- Name: ledger id; Type: DEFAULT; Schema: prisma_contract; Owner: -
--

ALTER TABLE ONLY prisma_contract.ledger ALTER COLUMN id SET DEFAULT nextval('prisma_contract.ledger_id_seq'::regclass);


--
-- Data for Name: contract; Type: TABLE DATA; Schema: prisma_contract; Owner: -
--

COPY prisma_contract.contract (core_hash, created_at, contract_json) FROM stdin;
5cb0fc262450ed95c9e9487dcfcdc9434112a3f4659b7c26f1b3b2294867a099	2026-10-05 01:08:24.581308+00	{"meta": {}, "roots": {"message": {"model": "Message", "namespace": "public"}, "paiement": {"model": "Paiement", "namespace": "public"}, "audit_log": {"model": "AuditLog", "namespace": "public"}, "abonnement": {"model": "Abonnement", "namespace": "public"}, "publication": {"model": "Publication", "namespace": "public"}, "signalement": {"model": "Signalement", "namespace": "public"}, "utilisateur": {"model": "Utilisateur", "namespace": "public"}, "conversation": {"model": "Conversation", "namespace": "public"}, "verification": {"model": "Verification", "namespace": "public"}, "professionnel": {"model": "Professionnel", "namespace": "public"}, "document_echange": {"model": "DocumentEchange", "namespace": "public"}, "formule_abonnement": {"model": "FormuleAbonnement", "namespace": "public"}, "document_verification": {"model": "DocumentVerification", "namespace": "public"}}, "domain": {"namespaces": {"public": {"models": {"Message": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "statut": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "contenu": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "date_envoi": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "expediteur_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "conversation_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}}, "storage": {"table": "message", "fields": {"id": {"column": "id"}, "statut": {"column": "statut"}, "contenu": {"column": "contenu"}, "date_envoi": {"column": "date_envoi"}, "expediteur_id": {"column": "expediteur_id"}, "conversation_id": {"column": "conversation_id"}}, "namespaceId": "public"}, "relations": {"expediteur": {"on": {"localFields": ["expediteur_id"], "targetFields": ["id"]}, "to": {"model": "Utilisateur", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}, "conversation": {"on": {"localFields": ["conversation_id"], "targetFields": ["id"]}, "to": {"model": "Conversation", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}}}, "AuditLog": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "date": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "action": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "utilisateur_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": true}, "informations_complementaires": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": true}}, "storage": {"table": "audit_log", "fields": {"id": {"column": "id"}, "date": {"column": "date"}, "action": {"column": "action"}, "utilisateur_id": {"column": "utilisateur_id"}, "informations_complementaires": {"column": "informations_complementaires"}}, "namespaceId": "public"}, "relations": {"utilisateur": {"on": {"localFields": ["utilisateur_id"], "targetFields": ["id"]}, "to": {"model": "Utilisateur", "namespace": "public"}, "nullable": true, "cardinality": "N:1"}}}, "Paiement": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "statut": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "montant": {"type": {"kind": "scalar", "codecId": "pg/int4@1"}, "nullable": false}, "reference": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "abonnement_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "date_creation": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "moyen_paiement": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "date_confirmation": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": true}}, "storage": {"table": "paiement", "fields": {"id": {"column": "id"}, "statut": {"column": "statut"}, "montant": {"column": "montant"}, "reference": {"column": "reference"}, "abonnement_id": {"column": "abonnement_id"}, "date_creation": {"column": "date_creation"}, "moyen_paiement": {"column": "moyen_paiement"}, "date_confirmation": {"column": "date_confirmation"}}, "namespaceId": "public"}, "relations": {"abonnement": {"on": {"localFields": ["abonnement_id"], "targetFields": ["id"]}, "to": {"model": "Abonnement", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}}}, "Abonnement": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "statut": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "date_fin": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "date_debut": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "formule_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "utilisateur_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}}, "storage": {"table": "abonnement", "fields": {"id": {"column": "id"}, "statut": {"column": "statut"}, "date_fin": {"column": "date_fin"}, "date_debut": {"column": "date_debut"}, "formule_id": {"column": "formule_id"}, "utilisateur_id": {"column": "utilisateur_id"}}, "namespaceId": "public"}, "relations": {"formule": {"on": {"localFields": ["formule_id"], "targetFields": ["id"]}, "to": {"model": "FormuleAbonnement", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}, "utilisateur": {"on": {"localFields": ["utilisateur_id"], "targetFields": ["id"]}, "to": {"model": "Utilisateur", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}}}, "Publication": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "titre": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "statut": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "contenu": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "date_creation": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "date_publication": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": true}, "professionnel_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}}, "storage": {"table": "publication", "fields": {"id": {"column": "id"}, "titre": {"column": "titre"}, "statut": {"column": "statut"}, "contenu": {"column": "contenu"}, "date_creation": {"column": "date_creation"}, "date_publication": {"column": "date_publication"}, "professionnel_id": {"column": "professionnel_id"}}, "namespaceId": "public"}, "relations": {"professionnel": {"on": {"localFields": ["professionnel_id"], "targetFields": ["id"]}, "to": {"model": "Professionnel", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}}}, "Signalement": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "motif": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "statut": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "cible_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "type_cible": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "description": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "date_creation": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "utilisateur_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}}, "storage": {"table": "signalement", "fields": {"id": {"column": "id"}, "motif": {"column": "motif"}, "statut": {"column": "statut"}, "cible_id": {"column": "cible_id"}, "type_cible": {"column": "type_cible"}, "description": {"column": "description"}, "date_creation": {"column": "date_creation"}, "utilisateur_id": {"column": "utilisateur_id"}}, "namespaceId": "public"}, "relations": {"utilisateur": {"on": {"localFields": ["utilisateur_id"], "targetFields": ["id"]}, "to": {"model": "Utilisateur", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}}}, "Utilisateur": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "nom": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "role": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "email": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "prenom": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "statut": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "telephone": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": true}, "created_at": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "mot_de_passe": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}}, "storage": {"table": "utilisateur", "fields": {"id": {"column": "id"}, "nom": {"column": "nom"}, "role": {"column": "role"}, "email": {"column": "email"}, "prenom": {"column": "prenom"}, "statut": {"column": "statut"}, "telephone": {"column": "telephone"}, "created_at": {"column": "created_at"}, "mot_de_passe": {"column": "mot_de_passe"}}, "namespaceId": "public"}, "relations": {}}, "Conversation": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "statut": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "voyageur_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "date_creation": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "professionnel_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}}, "storage": {"table": "conversation", "fields": {"id": {"column": "id"}, "statut": {"column": "statut"}, "voyageur_id": {"column": "voyageur_id"}, "date_creation": {"column": "date_creation"}, "professionnel_id": {"column": "professionnel_id"}}, "namespaceId": "public"}, "relations": {"voyageur": {"on": {"localFields": ["voyageur_id"], "targetFields": ["id"]}, "to": {"model": "Utilisateur", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}, "professionnel": {"on": {"localFields": ["professionnel_id"], "targetFields": ["id"]}, "to": {"model": "Professionnel", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}}}, "Verification": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "statut": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "date_debut": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "commentaire": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": true}, "date_decision": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": true}, "professionnel_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}}, "storage": {"table": "verification", "fields": {"id": {"column": "id"}, "statut": {"column": "statut"}, "date_debut": {"column": "date_debut"}, "commentaire": {"column": "commentaire"}, "date_decision": {"column": "date_decision"}, "professionnel_id": {"column": "professionnel_id"}}, "namespaceId": "public"}, "relations": {"professionnel": {"on": {"localFields": ["professionnel_id"], "targetFields": ["id"]}, "to": {"model": "Professionnel", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}}}, "Professionnel": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "created_at": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "description": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": true}, "nom_structure": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "utilisateur_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "statut_verification": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "informations_professionnelles": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": true}}, "storage": {"table": "professionnel", "fields": {"id": {"column": "id"}, "created_at": {"column": "created_at"}, "description": {"column": "description"}, "nom_structure": {"column": "nom_structure"}, "utilisateur_id": {"column": "utilisateur_id"}, "statut_verification": {"column": "statut_verification"}, "informations_professionnelles": {"column": "informations_professionnelles"}}, "namespaceId": "public"}, "relations": {"utilisateur": {"on": {"localFields": ["utilisateur_id"], "targetFields": ["id"]}, "to": {"model": "Utilisateur", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}}}, "DocumentEchange": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "fichier": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "date_envoi": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "expediteur_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "conversation_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}}, "storage": {"table": "document_echange", "fields": {"id": {"column": "id"}, "fichier": {"column": "fichier"}, "date_envoi": {"column": "date_envoi"}, "expediteur_id": {"column": "expediteur_id"}, "conversation_id": {"column": "conversation_id"}}, "namespaceId": "public"}, "relations": {"expediteur": {"on": {"localFields": ["expediteur_id"], "targetFields": ["id"]}, "to": {"model": "Utilisateur", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}, "conversation": {"on": {"localFields": ["conversation_id"], "targetFields": ["id"]}, "to": {"model": "Conversation", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}}}, "FormuleAbonnement": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "nom": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "prix": {"type": {"kind": "scalar", "codecId": "pg/int4@1"}, "nullable": false}, "duree": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "statut": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "type_utilisateur": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}}, "storage": {"table": "formule_abonnement", "fields": {"id": {"column": "id"}, "nom": {"column": "nom"}, "prix": {"column": "prix"}, "duree": {"column": "duree"}, "statut": {"column": "statut"}, "type_utilisateur": {"column": "type_utilisateur"}}, "namespaceId": "public"}, "relations": {}}, "DocumentVerification": {"fields": {"id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "statut": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "fichier": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "created_at": {"type": {"kind": "scalar", "codecId": "pg/timestamptz-temporal@1"}, "nullable": false}, "type_document": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}, "professionnel_id": {"type": {"kind": "scalar", "codecId": "pg/text@1"}, "nullable": false}}, "storage": {"table": "document_verification", "fields": {"id": {"column": "id"}, "statut": {"column": "statut"}, "fichier": {"column": "fichier"}, "created_at": {"column": "created_at"}, "type_document": {"column": "type_document"}, "professionnel_id": {"column": "professionnel_id"}}, "namespaceId": "public"}, "relations": {"professionnel": {"on": {"localFields": ["professionnel_id"], "targetFields": ["id"]}, "to": {"model": "Professionnel", "namespace": "public"}, "nullable": false, "cardinality": "N:1"}}}}}}}, "target": "postgres", "storage": {"namespaces": {"public": {"id": "public", "kind": "postgres-schema", "entries": {"table": {"message": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "statut": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "contenu": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "date_envoi": {"codecId": "pg/timestamptz-temporal@1", "default": {"kind": "function", "expression": "now()"}, "nullable": false, "nativeType": "timestamptz"}, "expediteur_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "conversation_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}}, "indexes": [{"name": "message_conversation_id_idx_0c3639df", "prefix": "message_conversation_id_idx", "unique": false, "columns": ["conversation_id"]}, {"name": "message_expediteur_id_idx_883054ea", "prefix": "message_expediteur_id_idx", "unique": false, "columns": ["expediteur_id"]}], "uniques": [], "primaryKey": {"columns": ["id"]}, "foreignKeys": [{"source": {"columns": ["conversation_id"], "tableName": "message", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "conversation", "namespaceId": "public"}, "onDelete": "cascade"}, {"source": {"columns": ["expediteur_id"], "tableName": "message", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "utilisateur", "namespaceId": "public"}, "onDelete": "restrict"}]}, "paiement": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "statut": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "montant": {"codecId": "pg/int4@1", "nullable": false, "nativeType": "int4"}, "reference": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "abonnement_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "date_creation": {"codecId": "pg/timestamptz-temporal@1", "default": {"kind": "function", "expression": "now()"}, "nullable": false, "nativeType": "timestamptz"}, "moyen_paiement": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "date_confirmation": {"codecId": "pg/timestamptz-temporal@1", "nullable": true, "nativeType": "timestamptz"}}, "indexes": [{"name": "paiement_abonnement_id_idx_038e7437", "prefix": "paiement_abonnement_id_idx", "unique": false, "columns": ["abonnement_id"]}], "uniques": [{"columns": ["reference"]}], "primaryKey": {"columns": ["id"]}, "foreignKeys": [{"source": {"columns": ["abonnement_id"], "tableName": "paiement", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "abonnement", "namespaceId": "public"}, "onDelete": "restrict"}]}, "audit_log": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "date": {"codecId": "pg/timestamptz-temporal@1", "default": {"kind": "function", "expression": "now()"}, "nullable": false, "nativeType": "timestamptz"}, "action": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "utilisateur_id": {"codecId": "pg/text@1", "nullable": true, "nativeType": "text"}, "informations_complementaires": {"codecId": "pg/text@1", "nullable": true, "nativeType": "text"}}, "indexes": [{"name": "audit_log_utilisateur_id_idx_afedb02c", "prefix": "audit_log_utilisateur_id_idx", "unique": false, "columns": ["utilisateur_id"]}], "uniques": [], "primaryKey": {"columns": ["id"]}, "foreignKeys": [{"source": {"columns": ["utilisateur_id"], "tableName": "audit_log", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "utilisateur", "namespaceId": "public"}, "onDelete": "setNull"}]}, "abonnement": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "statut": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "date_fin": {"codecId": "pg/timestamptz-temporal@1", "nullable": false, "nativeType": "timestamptz"}, "date_debut": {"codecId": "pg/timestamptz-temporal@1", "nullable": false, "nativeType": "timestamptz"}, "formule_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "utilisateur_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}}, "indexes": [{"name": "abonnement_formule_id_idx_885a400f", "prefix": "abonnement_formule_id_idx", "unique": false, "columns": ["formule_id"]}, {"name": "abonnement_utilisateur_id_idx_afedb02c", "prefix": "abonnement_utilisateur_id_idx", "unique": false, "columns": ["utilisateur_id"]}], "uniques": [], "primaryKey": {"columns": ["id"]}, "foreignKeys": [{"source": {"columns": ["utilisateur_id"], "tableName": "abonnement", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "utilisateur", "namespaceId": "public"}, "onDelete": "restrict"}, {"source": {"columns": ["formule_id"], "tableName": "abonnement", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "formule_abonnement", "namespaceId": "public"}, "onDelete": "restrict"}]}, "publication": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "titre": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "statut": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "contenu": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "date_creation": {"codecId": "pg/timestamptz-temporal@1", "default": {"kind": "function", "expression": "now()"}, "nullable": false, "nativeType": "timestamptz"}, "date_publication": {"codecId": "pg/timestamptz-temporal@1", "nullable": true, "nativeType": "timestamptz"}, "professionnel_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}}, "indexes": [{"name": "publication_professionnel_id_idx_015ea5a7", "prefix": "publication_professionnel_id_idx", "unique": false, "columns": ["professionnel_id"]}], "uniques": [], "primaryKey": {"columns": ["id"]}, "foreignKeys": [{"source": {"columns": ["professionnel_id"], "tableName": "publication", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "professionnel", "namespaceId": "public"}, "onDelete": "cascade"}]}, "signalement": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "motif": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "statut": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "cible_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "type_cible": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "description": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "date_creation": {"codecId": "pg/timestamptz-temporal@1", "default": {"kind": "function", "expression": "now()"}, "nullable": false, "nativeType": "timestamptz"}, "utilisateur_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}}, "indexes": [{"name": "signalement_utilisateur_id_idx_afedb02c", "prefix": "signalement_utilisateur_id_idx", "unique": false, "columns": ["utilisateur_id"]}], "uniques": [], "primaryKey": {"columns": ["id"]}, "foreignKeys": [{"source": {"columns": ["utilisateur_id"], "tableName": "signalement", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "utilisateur", "namespaceId": "public"}, "onDelete": "restrict"}]}, "utilisateur": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "nom": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "role": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "email": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "prenom": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "statut": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "telephone": {"codecId": "pg/text@1", "nullable": true, "nativeType": "text"}, "created_at": {"codecId": "pg/timestamptz-temporal@1", "default": {"kind": "function", "expression": "now()"}, "nullable": false, "nativeType": "timestamptz"}, "mot_de_passe": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}}, "indexes": [], "uniques": [{"columns": ["email"]}], "primaryKey": {"columns": ["id"]}, "foreignKeys": []}, "conversation": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "statut": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "voyageur_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "date_creation": {"codecId": "pg/timestamptz-temporal@1", "default": {"kind": "function", "expression": "now()"}, "nullable": false, "nativeType": "timestamptz"}, "professionnel_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}}, "indexes": [{"name": "conversation_professionnel_id_idx_015ea5a7", "prefix": "conversation_professionnel_id_idx", "unique": false, "columns": ["professionnel_id"]}, {"name": "conversation_voyageur_id_idx_09dceabd", "prefix": "conversation_voyageur_id_idx", "unique": false, "columns": ["voyageur_id"]}], "uniques": [], "primaryKey": {"columns": ["id"]}, "foreignKeys": [{"source": {"columns": ["voyageur_id"], "tableName": "conversation", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "utilisateur", "namespaceId": "public"}, "onDelete": "restrict"}, {"source": {"columns": ["professionnel_id"], "tableName": "conversation", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "professionnel", "namespaceId": "public"}, "onDelete": "restrict"}]}, "verification": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "statut": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "date_debut": {"codecId": "pg/timestamptz-temporal@1", "default": {"kind": "function", "expression": "now()"}, "nullable": false, "nativeType": "timestamptz"}, "commentaire": {"codecId": "pg/text@1", "nullable": true, "nativeType": "text"}, "date_decision": {"codecId": "pg/timestamptz-temporal@1", "nullable": true, "nativeType": "timestamptz"}, "professionnel_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}}, "indexes": [{"name": "verification_professionnel_id_idx_015ea5a7", "prefix": "verification_professionnel_id_idx", "unique": false, "columns": ["professionnel_id"]}], "uniques": [], "primaryKey": {"columns": ["id"]}, "foreignKeys": [{"source": {"columns": ["professionnel_id"], "tableName": "verification", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "professionnel", "namespaceId": "public"}, "onDelete": "cascade"}]}, "professionnel": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "created_at": {"codecId": "pg/timestamptz-temporal@1", "default": {"kind": "function", "expression": "now()"}, "nullable": false, "nativeType": "timestamptz"}, "description": {"codecId": "pg/text@1", "nullable": true, "nativeType": "text"}, "nom_structure": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "utilisateur_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "statut_verification": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "informations_professionnelles": {"codecId": "pg/text@1", "nullable": true, "nativeType": "text"}}, "indexes": [], "uniques": [{"columns": ["utilisateur_id"]}], "primaryKey": {"columns": ["id"]}, "foreignKeys": [{"source": {"columns": ["utilisateur_id"], "tableName": "professionnel", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "utilisateur", "namespaceId": "public"}, "onDelete": "cascade"}]}, "document_echange": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "fichier": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "date_envoi": {"codecId": "pg/timestamptz-temporal@1", "default": {"kind": "function", "expression": "now()"}, "nullable": false, "nativeType": "timestamptz"}, "expediteur_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "conversation_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}}, "indexes": [{"name": "document_echange_conversation_id_idx_0c3639df", "prefix": "document_echange_conversation_id_idx", "unique": false, "columns": ["conversation_id"]}, {"name": "document_echange_expediteur_id_idx_883054ea", "prefix": "document_echange_expediteur_id_idx", "unique": false, "columns": ["expediteur_id"]}], "uniques": [], "primaryKey": {"columns": ["id"]}, "foreignKeys": [{"source": {"columns": ["conversation_id"], "tableName": "document_echange", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "conversation", "namespaceId": "public"}, "onDelete": "cascade"}, {"source": {"columns": ["expediteur_id"], "tableName": "document_echange", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "utilisateur", "namespaceId": "public"}, "onDelete": "restrict"}]}, "formule_abonnement": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "nom": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "prix": {"codecId": "pg/int4@1", "nullable": false, "nativeType": "int4"}, "duree": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "statut": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "type_utilisateur": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}}, "indexes": [], "uniques": [], "primaryKey": {"columns": ["id"]}, "foreignKeys": []}, "document_verification": {"columns": {"id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "statut": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "fichier": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "created_at": {"codecId": "pg/timestamptz-temporal@1", "default": {"kind": "function", "expression": "now()"}, "nullable": false, "nativeType": "timestamptz"}, "type_document": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}, "professionnel_id": {"codecId": "pg/text@1", "nullable": false, "nativeType": "text"}}, "indexes": [{"name": "document_verification_professionnel_id_idx_015ea5a7", "prefix": "document_verification_professionnel_id_idx", "unique": false, "columns": ["professionnel_id"]}], "uniques": [], "primaryKey": {"columns": ["id"]}, "foreignKeys": [{"source": {"columns": ["professionnel_id"], "tableName": "document_verification", "namespaceId": "public"}, "target": {"columns": ["id"], "tableName": "professionnel", "namespaceId": "public"}, "onDelete": "cascade"}]}}}}}, "storageHash": "5cb0fc262450ed95c9e9487dcfcdc9434112a3f4659b7c26f1b3b2294867a099"}, "execution": {"mutations": {"defaults": [{"ref": {"entry": "abonnement", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}, {"ref": {"entry": "audit_log", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}, {"ref": {"entry": "conversation", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}, {"ref": {"entry": "document_echange", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}, {"ref": {"entry": "document_verification", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}, {"ref": {"entry": "formule_abonnement", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}, {"ref": {"entry": "message", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}, {"ref": {"entry": "paiement", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}, {"ref": {"entry": "professionnel", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}, {"ref": {"entry": "publication", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}, {"ref": {"entry": "signalement", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}, {"ref": {"entry": "utilisateur", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}, {"ref": {"entry": "verification", "field": "id", "namespace": "public"}, "onCreate": {"id": "uuidv4", "kind": "generator"}}]}, "executionHash": "51ee6ddd3bc92f304d49bb819374ec976d609ee9b7ad353055a00def4fc369af"}, "_generated": {"message": "This file is automatically generated by \\"prisma contract emit\\".", "warning": "⚠️  GENERATED FILE - DO NOT EDIT", "regenerate": "To regenerate, run: prisma contract emit"}, "extensions": {}, "profileHash": "3916f444a8a17ad749191acf9e08dad97d1a327b88c2f1d45d12f240296aa8b2", "capabilities": {"sql": {"enums": true, "lateral": true, "returning": true, "scalarList": true, "checkConstraint": true, "defaultInInsert": true, "insertOnConflictSkip": true, "insertOnConflictWithoutTarget": true}, "postgres": {"limit": true, "jsonAgg": true, "lateral": true, "orderBy": true, "returning": true, "distinctOn": true}}, "targetFamily": "sql", "schemaVersion": "1"}
\.


--
-- Data for Name: ledger; Type: TABLE DATA; Schema: prisma_contract; Owner: -
--

COPY prisma_contract.ledger (id, created_at, space, migration_name, migration_hash, origin_core_hash, origin_profile_hash, destination_core_hash, destination_profile_hash, operations) FROM stdin;
1	2026-10-05 01:08:24.581308+00	app	20261005T0046_init	a1bddbe6df8042b601a3a27e32938cc35635e6ee7055bf285e7e79872c50940d	empty	\N	5cb0fc262450ed95c9e9487dcfcdc9434112a3f4659b7c26f1b3b2294867a099	\N	[{"id": "schema.public", "label": "Create schema \\"public\\"", "target": {"id": "postgres"}, "execute": [{"sql": "CREATE SCHEMA IF NOT EXISTS \\"public\\"", "params": [], "description": "Create schema \\"public\\""}], "precheck": [], "postcheck": [], "operationClass": "additive"}, {"id": "table.abonnement", "label": "Create table \\"abonnement\\"", "target": {"id": "postgres", "details": {"name": "abonnement", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"abonnement\\" (\\n  \\"date_debut\\" timestamptz NOT NULL,\\n  \\"date_fin\\" timestamptz NOT NULL,\\n  \\"formule_id\\" text NOT NULL,\\n  \\"id\\" text NOT NULL,\\n  \\"statut\\" text NOT NULL,\\n  \\"utilisateur_id\\" text NOT NULL,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"abonnement\\""}], "summary": "Creates table \\"abonnement\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"abonnement\\""], "description": "ensure table \\"abonnement\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"abonnement\\""], "description": "verify table \\"abonnement\\" exists"}], "operationClass": "additive"}, {"id": "table.audit_log", "label": "Create table \\"audit_log\\"", "target": {"id": "postgres", "details": {"name": "audit_log", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"audit_log\\" (\\n  \\"action\\" text NOT NULL,\\n  \\"date\\" timestamptz DEFAULT (now()) NOT NULL,\\n  \\"id\\" text NOT NULL,\\n  \\"informations_complementaires\\" text,\\n  \\"utilisateur_id\\" text,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"audit_log\\""}], "summary": "Creates table \\"audit_log\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"audit_log\\""], "description": "ensure table \\"audit_log\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"audit_log\\""], "description": "verify table \\"audit_log\\" exists"}], "operationClass": "additive"}, {"id": "table.conversation", "label": "Create table \\"conversation\\"", "target": {"id": "postgres", "details": {"name": "conversation", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"conversation\\" (\\n  \\"date_creation\\" timestamptz DEFAULT (now()) NOT NULL,\\n  \\"id\\" text NOT NULL,\\n  \\"professionnel_id\\" text NOT NULL,\\n  \\"statut\\" text NOT NULL,\\n  \\"voyageur_id\\" text NOT NULL,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"conversation\\""}], "summary": "Creates table \\"conversation\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"conversation\\""], "description": "ensure table \\"conversation\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"conversation\\""], "description": "verify table \\"conversation\\" exists"}], "operationClass": "additive"}, {"id": "table.document_echange", "label": "Create table \\"document_echange\\"", "target": {"id": "postgres", "details": {"name": "document_echange", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"document_echange\\" (\\n  \\"conversation_id\\" text NOT NULL,\\n  \\"date_envoi\\" timestamptz DEFAULT (now()) NOT NULL,\\n  \\"expediteur_id\\" text NOT NULL,\\n  \\"fichier\\" text NOT NULL,\\n  \\"id\\" text NOT NULL,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"document_echange\\""}], "summary": "Creates table \\"document_echange\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"document_echange\\""], "description": "ensure table \\"document_echange\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"document_echange\\""], "description": "verify table \\"document_echange\\" exists"}], "operationClass": "additive"}, {"id": "table.document_verification", "label": "Create table \\"document_verification\\"", "target": {"id": "postgres", "details": {"name": "document_verification", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"document_verification\\" (\\n  \\"created_at\\" timestamptz DEFAULT (now()) NOT NULL,\\n  \\"fichier\\" text NOT NULL,\\n  \\"id\\" text NOT NULL,\\n  \\"professionnel_id\\" text NOT NULL,\\n  \\"statut\\" text NOT NULL,\\n  \\"type_document\\" text NOT NULL,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"document_verification\\""}], "summary": "Creates table \\"document_verification\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"document_verification\\""], "description": "ensure table \\"document_verification\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"document_verification\\""], "description": "verify table \\"document_verification\\" exists"}], "operationClass": "additive"}, {"id": "table.formule_abonnement", "label": "Create table \\"formule_abonnement\\"", "target": {"id": "postgres", "details": {"name": "formule_abonnement", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"formule_abonnement\\" (\\n  \\"duree\\" text NOT NULL,\\n  \\"id\\" text NOT NULL,\\n  \\"nom\\" text NOT NULL,\\n  \\"prix\\" int4 NOT NULL,\\n  \\"statut\\" text NOT NULL,\\n  \\"type_utilisateur\\" text NOT NULL,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"formule_abonnement\\""}], "summary": "Creates table \\"formule_abonnement\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"formule_abonnement\\""], "description": "ensure table \\"formule_abonnement\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"formule_abonnement\\""], "description": "verify table \\"formule_abonnement\\" exists"}], "operationClass": "additive"}, {"id": "table.message", "label": "Create table \\"message\\"", "target": {"id": "postgres", "details": {"name": "message", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"message\\" (\\n  \\"contenu\\" text NOT NULL,\\n  \\"conversation_id\\" text NOT NULL,\\n  \\"date_envoi\\" timestamptz DEFAULT (now()) NOT NULL,\\n  \\"expediteur_id\\" text NOT NULL,\\n  \\"id\\" text NOT NULL,\\n  \\"statut\\" text NOT NULL,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"message\\""}], "summary": "Creates table \\"message\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"message\\""], "description": "ensure table \\"message\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"message\\""], "description": "verify table \\"message\\" exists"}], "operationClass": "additive"}, {"id": "table.paiement", "label": "Create table \\"paiement\\"", "target": {"id": "postgres", "details": {"name": "paiement", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"paiement\\" (\\n  \\"abonnement_id\\" text NOT NULL,\\n  \\"date_confirmation\\" timestamptz,\\n  \\"date_creation\\" timestamptz DEFAULT (now()) NOT NULL,\\n  \\"id\\" text NOT NULL,\\n  \\"montant\\" int4 NOT NULL,\\n  \\"moyen_paiement\\" text NOT NULL,\\n  \\"reference\\" text NOT NULL,\\n  \\"statut\\" text NOT NULL,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"paiement\\""}], "summary": "Creates table \\"paiement\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"paiement\\""], "description": "ensure table \\"paiement\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"paiement\\""], "description": "verify table \\"paiement\\" exists"}], "operationClass": "additive"}, {"id": "table.professionnel", "label": "Create table \\"professionnel\\"", "target": {"id": "postgres", "details": {"name": "professionnel", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"professionnel\\" (\\n  \\"created_at\\" timestamptz DEFAULT (now()) NOT NULL,\\n  \\"description\\" text,\\n  \\"id\\" text NOT NULL,\\n  \\"informations_professionnelles\\" text,\\n  \\"nom_structure\\" text NOT NULL,\\n  \\"statut_verification\\" text NOT NULL,\\n  \\"utilisateur_id\\" text NOT NULL,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"professionnel\\""}], "summary": "Creates table \\"professionnel\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"professionnel\\""], "description": "ensure table \\"professionnel\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"professionnel\\""], "description": "verify table \\"professionnel\\" exists"}], "operationClass": "additive"}, {"id": "table.publication", "label": "Create table \\"publication\\"", "target": {"id": "postgres", "details": {"name": "publication", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"publication\\" (\\n  \\"contenu\\" text NOT NULL,\\n  \\"date_creation\\" timestamptz DEFAULT (now()) NOT NULL,\\n  \\"date_publication\\" timestamptz,\\n  \\"id\\" text NOT NULL,\\n  \\"professionnel_id\\" text NOT NULL,\\n  \\"statut\\" text NOT NULL,\\n  \\"titre\\" text NOT NULL,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"publication\\""}], "summary": "Creates table \\"publication\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"publication\\""], "description": "ensure table \\"publication\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"publication\\""], "description": "verify table \\"publication\\" exists"}], "operationClass": "additive"}, {"id": "table.signalement", "label": "Create table \\"signalement\\"", "target": {"id": "postgres", "details": {"name": "signalement", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"signalement\\" (\\n  \\"cible_id\\" text NOT NULL,\\n  \\"date_creation\\" timestamptz DEFAULT (now()) NOT NULL,\\n  \\"description\\" text NOT NULL,\\n  \\"id\\" text NOT NULL,\\n  \\"motif\\" text NOT NULL,\\n  \\"statut\\" text NOT NULL,\\n  \\"type_cible\\" text NOT NULL,\\n  \\"utilisateur_id\\" text NOT NULL,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"signalement\\""}], "summary": "Creates table \\"signalement\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"signalement\\""], "description": "ensure table \\"signalement\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"signalement\\""], "description": "verify table \\"signalement\\" exists"}], "operationClass": "additive"}, {"id": "table.utilisateur", "label": "Create table \\"utilisateur\\"", "target": {"id": "postgres", "details": {"name": "utilisateur", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"utilisateur\\" (\\n  \\"created_at\\" timestamptz DEFAULT (now()) NOT NULL,\\n  \\"email\\" text NOT NULL,\\n  \\"id\\" text NOT NULL,\\n  \\"mot_de_passe\\" text NOT NULL,\\n  \\"nom\\" text NOT NULL,\\n  \\"prenom\\" text NOT NULL,\\n  \\"role\\" text NOT NULL,\\n  \\"statut\\" text NOT NULL,\\n  \\"telephone\\" text,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"utilisateur\\""}], "summary": "Creates table \\"utilisateur\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"utilisateur\\""], "description": "ensure table \\"utilisateur\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"utilisateur\\""], "description": "verify table \\"utilisateur\\" exists"}], "operationClass": "additive"}, {"id": "table.verification", "label": "Create table \\"verification\\"", "target": {"id": "postgres", "details": {"name": "verification", "schema": "public", "objectType": "table"}}, "execute": [{"sql": "CREATE TABLE \\"public\\".\\"verification\\" (\\n  \\"commentaire\\" text,\\n  \\"date_debut\\" timestamptz DEFAULT (now()) NOT NULL,\\n  \\"date_decision\\" timestamptz,\\n  \\"id\\" text NOT NULL,\\n  \\"professionnel_id\\" text NOT NULL,\\n  \\"statut\\" text NOT NULL,\\n  PRIMARY KEY (\\"id\\")\\n)", "params": [], "description": "create table \\"verification\\""}], "summary": "Creates table \\"verification\\"", "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"verification\\""], "description": "ensure table \\"verification\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"verification\\""], "description": "verify table \\"verification\\" exists"}], "operationClass": "additive"}, {"id": "unique.paiement.paiement_reference_key", "label": "Add unique constraint on \\"paiement\\" (reference)", "target": {"id": "postgres", "details": {"name": "paiement_reference_key", "table": "paiement", "schema": "public", "objectType": "unique"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"paiement\\" ADD CONSTRAINT \\"paiement_reference_key\\" UNIQUE (\\"reference\\")", "description": "add unique constraint \\"paiement_reference_key\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["paiement_reference_key", "public", "\\"public\\".\\"paiement\\""], "description": "ensure constraint \\"paiement_reference_key\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["paiement_reference_key", "public", "\\"public\\".\\"paiement\\""], "description": "verify constraint \\"paiement_reference_key\\" exists"}], "operationClass": "additive"}, {"id": "unique.professionnel.professionnel_utilisateur_id_key", "label": "Add unique constraint on \\"professionnel\\" (utilisateur_id)", "target": {"id": "postgres", "details": {"name": "professionnel_utilisateur_id_key", "table": "professionnel", "schema": "public", "objectType": "unique"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"professionnel\\" ADD CONSTRAINT \\"professionnel_utilisateur_id_key\\" UNIQUE (\\"utilisateur_id\\")", "description": "add unique constraint \\"professionnel_utilisateur_id_key\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["professionnel_utilisateur_id_key", "public", "\\"public\\".\\"professionnel\\""], "description": "ensure constraint \\"professionnel_utilisateur_id_key\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["professionnel_utilisateur_id_key", "public", "\\"public\\".\\"professionnel\\""], "description": "verify constraint \\"professionnel_utilisateur_id_key\\" exists"}], "operationClass": "additive"}, {"id": "unique.utilisateur.utilisateur_email_key", "label": "Add unique constraint on \\"utilisateur\\" (email)", "target": {"id": "postgres", "details": {"name": "utilisateur_email_key", "table": "utilisateur", "schema": "public", "objectType": "unique"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"utilisateur\\" ADD CONSTRAINT \\"utilisateur_email_key\\" UNIQUE (\\"email\\")", "description": "add unique constraint \\"utilisateur_email_key\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["utilisateur_email_key", "public", "\\"public\\".\\"utilisateur\\""], "description": "ensure constraint \\"utilisateur_email_key\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["utilisateur_email_key", "public", "\\"public\\".\\"utilisateur\\""], "description": "verify constraint \\"utilisateur_email_key\\" exists"}], "operationClass": "additive"}, {"id": "index.abonnement.abonnement_formule_id_idx_885a400f", "label": "Create index \\"abonnement_formule_id_idx_885a400f\\" on \\"abonnement\\"", "target": {"id": "postgres", "details": {"name": "abonnement_formule_id_idx_885a400f", "table": "abonnement", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"abonnement_formule_id_idx_885a400f\\" ON \\"public\\".\\"abonnement\\" (\\"formule_id\\")", "params": [], "description": "create index \\"abonnement_formule_id_idx_885a400f\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"abonnement_formule_id_idx_885a400f\\""], "description": "ensure index \\"abonnement_formule_id_idx_885a400f\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"abonnement_formule_id_idx_885a400f\\""], "description": "verify index \\"abonnement_formule_id_idx_885a400f\\" exists"}], "operationClass": "additive"}, {"id": "index.abonnement.abonnement_utilisateur_id_idx_afedb02c", "label": "Create index \\"abonnement_utilisateur_id_idx_afedb02c\\" on \\"abonnement\\"", "target": {"id": "postgres", "details": {"name": "abonnement_utilisateur_id_idx_afedb02c", "table": "abonnement", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"abonnement_utilisateur_id_idx_afedb02c\\" ON \\"public\\".\\"abonnement\\" (\\"utilisateur_id\\")", "params": [], "description": "create index \\"abonnement_utilisateur_id_idx_afedb02c\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"abonnement_utilisateur_id_idx_afedb02c\\""], "description": "ensure index \\"abonnement_utilisateur_id_idx_afedb02c\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"abonnement_utilisateur_id_idx_afedb02c\\""], "description": "verify index \\"abonnement_utilisateur_id_idx_afedb02c\\" exists"}], "operationClass": "additive"}, {"id": "index.audit_log.audit_log_utilisateur_id_idx_afedb02c", "label": "Create index \\"audit_log_utilisateur_id_idx_afedb02c\\" on \\"audit_log\\"", "target": {"id": "postgres", "details": {"name": "audit_log_utilisateur_id_idx_afedb02c", "table": "audit_log", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"audit_log_utilisateur_id_idx_afedb02c\\" ON \\"public\\".\\"audit_log\\" (\\"utilisateur_id\\")", "params": [], "description": "create index \\"audit_log_utilisateur_id_idx_afedb02c\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"audit_log_utilisateur_id_idx_afedb02c\\""], "description": "ensure index \\"audit_log_utilisateur_id_idx_afedb02c\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"audit_log_utilisateur_id_idx_afedb02c\\""], "description": "verify index \\"audit_log_utilisateur_id_idx_afedb02c\\" exists"}], "operationClass": "additive"}, {"id": "index.conversation.conversation_professionnel_id_idx_015ea5a7", "label": "Create index \\"conversation_professionnel_id_idx_015ea5a7\\" on \\"conversation\\"", "target": {"id": "postgres", "details": {"name": "conversation_professionnel_id_idx_015ea5a7", "table": "conversation", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"conversation_professionnel_id_idx_015ea5a7\\" ON \\"public\\".\\"conversation\\" (\\"professionnel_id\\")", "params": [], "description": "create index \\"conversation_professionnel_id_idx_015ea5a7\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"conversation_professionnel_id_idx_015ea5a7\\""], "description": "ensure index \\"conversation_professionnel_id_idx_015ea5a7\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"conversation_professionnel_id_idx_015ea5a7\\""], "description": "verify index \\"conversation_professionnel_id_idx_015ea5a7\\" exists"}], "operationClass": "additive"}, {"id": "index.conversation.conversation_voyageur_id_idx_09dceabd", "label": "Create index \\"conversation_voyageur_id_idx_09dceabd\\" on \\"conversation\\"", "target": {"id": "postgres", "details": {"name": "conversation_voyageur_id_idx_09dceabd", "table": "conversation", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"conversation_voyageur_id_idx_09dceabd\\" ON \\"public\\".\\"conversation\\" (\\"voyageur_id\\")", "params": [], "description": "create index \\"conversation_voyageur_id_idx_09dceabd\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"conversation_voyageur_id_idx_09dceabd\\""], "description": "ensure index \\"conversation_voyageur_id_idx_09dceabd\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"conversation_voyageur_id_idx_09dceabd\\""], "description": "verify index \\"conversation_voyageur_id_idx_09dceabd\\" exists"}], "operationClass": "additive"}, {"id": "index.document_echange.document_echange_conversation_id_idx_0c3639df", "label": "Create index \\"document_echange_conversation_id_idx_0c3639df\\" on \\"document_echange\\"", "target": {"id": "postgres", "details": {"name": "document_echange_conversation_id_idx_0c3639df", "table": "document_echange", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"document_echange_conversation_id_idx_0c3639df\\" ON \\"public\\".\\"document_echange\\" (\\"conversation_id\\")", "params": [], "description": "create index \\"document_echange_conversation_id_idx_0c3639df\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"document_echange_conversation_id_idx_0c3639df\\""], "description": "ensure index \\"document_echange_conversation_id_idx_0c3639df\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"document_echange_conversation_id_idx_0c3639df\\""], "description": "verify index \\"document_echange_conversation_id_idx_0c3639df\\" exists"}], "operationClass": "additive"}, {"id": "index.document_echange.document_echange_expediteur_id_idx_883054ea", "label": "Create index \\"document_echange_expediteur_id_idx_883054ea\\" on \\"document_echange\\"", "target": {"id": "postgres", "details": {"name": "document_echange_expediteur_id_idx_883054ea", "table": "document_echange", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"document_echange_expediteur_id_idx_883054ea\\" ON \\"public\\".\\"document_echange\\" (\\"expediteur_id\\")", "params": [], "description": "create index \\"document_echange_expediteur_id_idx_883054ea\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"document_echange_expediteur_id_idx_883054ea\\""], "description": "ensure index \\"document_echange_expediteur_id_idx_883054ea\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"document_echange_expediteur_id_idx_883054ea\\""], "description": "verify index \\"document_echange_expediteur_id_idx_883054ea\\" exists"}], "operationClass": "additive"}, {"id": "index.document_verification.document_verification_professionnel_id_idx_015ea5a7", "label": "Create index \\"document_verification_professionnel_id_idx_015ea5a7\\" on \\"document_verification\\"", "target": {"id": "postgres", "details": {"name": "document_verification_professionnel_id_idx_015ea5a7", "table": "document_verification", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"document_verification_professionnel_id_idx_015ea5a7\\" ON \\"public\\".\\"document_verification\\" (\\"professionnel_id\\")", "params": [], "description": "create index \\"document_verification_professionnel_id_idx_015ea5a7\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"document_verification_professionnel_id_idx_015ea5a7\\""], "description": "ensure index \\"document_verification_professionnel_id_idx_015ea5a7\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"document_verification_professionnel_id_idx_015ea5a7\\""], "description": "verify index \\"document_verification_professionnel_id_idx_015ea5a7\\" exists"}], "operationClass": "additive"}, {"id": "index.message.message_conversation_id_idx_0c3639df", "label": "Create index \\"message_conversation_id_idx_0c3639df\\" on \\"message\\"", "target": {"id": "postgres", "details": {"name": "message_conversation_id_idx_0c3639df", "table": "message", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"message_conversation_id_idx_0c3639df\\" ON \\"public\\".\\"message\\" (\\"conversation_id\\")", "params": [], "description": "create index \\"message_conversation_id_idx_0c3639df\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"message_conversation_id_idx_0c3639df\\""], "description": "ensure index \\"message_conversation_id_idx_0c3639df\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"message_conversation_id_idx_0c3639df\\""], "description": "verify index \\"message_conversation_id_idx_0c3639df\\" exists"}], "operationClass": "additive"}, {"id": "index.message.message_expediteur_id_idx_883054ea", "label": "Create index \\"message_expediteur_id_idx_883054ea\\" on \\"message\\"", "target": {"id": "postgres", "details": {"name": "message_expediteur_id_idx_883054ea", "table": "message", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"message_expediteur_id_idx_883054ea\\" ON \\"public\\".\\"message\\" (\\"expediteur_id\\")", "params": [], "description": "create index \\"message_expediteur_id_idx_883054ea\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"message_expediteur_id_idx_883054ea\\""], "description": "ensure index \\"message_expediteur_id_idx_883054ea\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"message_expediteur_id_idx_883054ea\\""], "description": "verify index \\"message_expediteur_id_idx_883054ea\\" exists"}], "operationClass": "additive"}, {"id": "index.paiement.paiement_abonnement_id_idx_038e7437", "label": "Create index \\"paiement_abonnement_id_idx_038e7437\\" on \\"paiement\\"", "target": {"id": "postgres", "details": {"name": "paiement_abonnement_id_idx_038e7437", "table": "paiement", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"paiement_abonnement_id_idx_038e7437\\" ON \\"public\\".\\"paiement\\" (\\"abonnement_id\\")", "params": [], "description": "create index \\"paiement_abonnement_id_idx_038e7437\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"paiement_abonnement_id_idx_038e7437\\""], "description": "ensure index \\"paiement_abonnement_id_idx_038e7437\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"paiement_abonnement_id_idx_038e7437\\""], "description": "verify index \\"paiement_abonnement_id_idx_038e7437\\" exists"}], "operationClass": "additive"}, {"id": "index.publication.publication_professionnel_id_idx_015ea5a7", "label": "Create index \\"publication_professionnel_id_idx_015ea5a7\\" on \\"publication\\"", "target": {"id": "postgres", "details": {"name": "publication_professionnel_id_idx_015ea5a7", "table": "publication", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"publication_professionnel_id_idx_015ea5a7\\" ON \\"public\\".\\"publication\\" (\\"professionnel_id\\")", "params": [], "description": "create index \\"publication_professionnel_id_idx_015ea5a7\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"publication_professionnel_id_idx_015ea5a7\\""], "description": "ensure index \\"publication_professionnel_id_idx_015ea5a7\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"publication_professionnel_id_idx_015ea5a7\\""], "description": "verify index \\"publication_professionnel_id_idx_015ea5a7\\" exists"}], "operationClass": "additive"}, {"id": "index.signalement.signalement_utilisateur_id_idx_afedb02c", "label": "Create index \\"signalement_utilisateur_id_idx_afedb02c\\" on \\"signalement\\"", "target": {"id": "postgres", "details": {"name": "signalement_utilisateur_id_idx_afedb02c", "table": "signalement", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"signalement_utilisateur_id_idx_afedb02c\\" ON \\"public\\".\\"signalement\\" (\\"utilisateur_id\\")", "params": [], "description": "create index \\"signalement_utilisateur_id_idx_afedb02c\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"signalement_utilisateur_id_idx_afedb02c\\""], "description": "ensure index \\"signalement_utilisateur_id_idx_afedb02c\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"signalement_utilisateur_id_idx_afedb02c\\""], "description": "verify index \\"signalement_utilisateur_id_idx_afedb02c\\" exists"}], "operationClass": "additive"}, {"id": "index.verification.verification_professionnel_id_idx_015ea5a7", "label": "Create index \\"verification_professionnel_id_idx_015ea5a7\\" on \\"verification\\"", "target": {"id": "postgres", "details": {"name": "verification_professionnel_id_idx_015ea5a7", "table": "verification", "schema": "public", "objectType": "index"}}, "execute": [{"sql": "CREATE INDEX \\"verification_professionnel_id_idx_015ea5a7\\" ON \\"public\\".\\"verification\\" (\\"professionnel_id\\")", "params": [], "description": "create index \\"verification_professionnel_id_idx_015ea5a7\\""}], "precheck": [{"sql": "SELECT (to_regclass($1)) IS NULL AS \\"result\\"", "params": ["\\"public\\".\\"verification_professionnel_id_idx_015ea5a7\\""], "description": "ensure index \\"verification_professionnel_id_idx_015ea5a7\\" does not exist"}], "postcheck": [{"sql": "SELECT (to_regclass($1)) IS NOT NULL AS \\"result\\"", "params": ["\\"public\\".\\"verification_professionnel_id_idx_015ea5a7\\""], "description": "verify index \\"verification_professionnel_id_idx_015ea5a7\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.abonnement.abonnement_utilisateur_id_fkey", "label": "Add foreign key \\"abonnement_utilisateur_id_fkey\\" on \\"abonnement\\"", "target": {"id": "postgres", "details": {"name": "abonnement_utilisateur_id_fkey", "table": "abonnement", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"abonnement\\"\\nADD CONSTRAINT \\"abonnement_utilisateur_id_fkey\\"\\nFOREIGN KEY (\\"utilisateur_id\\")\\nREFERENCES \\"public\\".\\"utilisateur\\" (\\"id\\")\\nON DELETE RESTRICT", "description": "add FK \\"abonnement_utilisateur_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["abonnement_utilisateur_id_fkey", "public", "\\"public\\".\\"abonnement\\""], "description": "ensure FK \\"abonnement_utilisateur_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["abonnement_utilisateur_id_fkey", "public", "\\"public\\".\\"abonnement\\""], "description": "verify FK \\"abonnement_utilisateur_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.abonnement.abonnement_formule_id_fkey", "label": "Add foreign key \\"abonnement_formule_id_fkey\\" on \\"abonnement\\"", "target": {"id": "postgres", "details": {"name": "abonnement_formule_id_fkey", "table": "abonnement", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"abonnement\\"\\nADD CONSTRAINT \\"abonnement_formule_id_fkey\\"\\nFOREIGN KEY (\\"formule_id\\")\\nREFERENCES \\"public\\".\\"formule_abonnement\\" (\\"id\\")\\nON DELETE RESTRICT", "description": "add FK \\"abonnement_formule_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["abonnement_formule_id_fkey", "public", "\\"public\\".\\"abonnement\\""], "description": "ensure FK \\"abonnement_formule_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["abonnement_formule_id_fkey", "public", "\\"public\\".\\"abonnement\\""], "description": "verify FK \\"abonnement_formule_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.audit_log.audit_log_utilisateur_id_fkey", "label": "Add foreign key \\"audit_log_utilisateur_id_fkey\\" on \\"audit_log\\"", "target": {"id": "postgres", "details": {"name": "audit_log_utilisateur_id_fkey", "table": "audit_log", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"audit_log\\"\\nADD CONSTRAINT \\"audit_log_utilisateur_id_fkey\\"\\nFOREIGN KEY (\\"utilisateur_id\\")\\nREFERENCES \\"public\\".\\"utilisateur\\" (\\"id\\")\\nON DELETE SET NULL", "description": "add FK \\"audit_log_utilisateur_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["audit_log_utilisateur_id_fkey", "public", "\\"public\\".\\"audit_log\\""], "description": "ensure FK \\"audit_log_utilisateur_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["audit_log_utilisateur_id_fkey", "public", "\\"public\\".\\"audit_log\\""], "description": "verify FK \\"audit_log_utilisateur_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.conversation.conversation_voyageur_id_fkey", "label": "Add foreign key \\"conversation_voyageur_id_fkey\\" on \\"conversation\\"", "target": {"id": "postgres", "details": {"name": "conversation_voyageur_id_fkey", "table": "conversation", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"conversation\\"\\nADD CONSTRAINT \\"conversation_voyageur_id_fkey\\"\\nFOREIGN KEY (\\"voyageur_id\\")\\nREFERENCES \\"public\\".\\"utilisateur\\" (\\"id\\")\\nON DELETE RESTRICT", "description": "add FK \\"conversation_voyageur_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["conversation_voyageur_id_fkey", "public", "\\"public\\".\\"conversation\\""], "description": "ensure FK \\"conversation_voyageur_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["conversation_voyageur_id_fkey", "public", "\\"public\\".\\"conversation\\""], "description": "verify FK \\"conversation_voyageur_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.conversation.conversation_professionnel_id_fkey", "label": "Add foreign key \\"conversation_professionnel_id_fkey\\" on \\"conversation\\"", "target": {"id": "postgres", "details": {"name": "conversation_professionnel_id_fkey", "table": "conversation", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"conversation\\"\\nADD CONSTRAINT \\"conversation_professionnel_id_fkey\\"\\nFOREIGN KEY (\\"professionnel_id\\")\\nREFERENCES \\"public\\".\\"professionnel\\" (\\"id\\")\\nON DELETE RESTRICT", "description": "add FK \\"conversation_professionnel_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["conversation_professionnel_id_fkey", "public", "\\"public\\".\\"conversation\\""], "description": "ensure FK \\"conversation_professionnel_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["conversation_professionnel_id_fkey", "public", "\\"public\\".\\"conversation\\""], "description": "verify FK \\"conversation_professionnel_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.document_echange.document_echange_conversation_id_fkey", "label": "Add foreign key \\"document_echange_conversation_id_fkey\\" on \\"document_echange\\"", "target": {"id": "postgres", "details": {"name": "document_echange_conversation_id_fkey", "table": "document_echange", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"document_echange\\"\\nADD CONSTRAINT \\"document_echange_conversation_id_fkey\\"\\nFOREIGN KEY (\\"conversation_id\\")\\nREFERENCES \\"public\\".\\"conversation\\" (\\"id\\")\\nON DELETE CASCADE", "description": "add FK \\"document_echange_conversation_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["document_echange_conversation_id_fkey", "public", "\\"public\\".\\"document_echange\\""], "description": "ensure FK \\"document_echange_conversation_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["document_echange_conversation_id_fkey", "public", "\\"public\\".\\"document_echange\\""], "description": "verify FK \\"document_echange_conversation_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.document_echange.document_echange_expediteur_id_fkey", "label": "Add foreign key \\"document_echange_expediteur_id_fkey\\" on \\"document_echange\\"", "target": {"id": "postgres", "details": {"name": "document_echange_expediteur_id_fkey", "table": "document_echange", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"document_echange\\"\\nADD CONSTRAINT \\"document_echange_expediteur_id_fkey\\"\\nFOREIGN KEY (\\"expediteur_id\\")\\nREFERENCES \\"public\\".\\"utilisateur\\" (\\"id\\")\\nON DELETE RESTRICT", "description": "add FK \\"document_echange_expediteur_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["document_echange_expediteur_id_fkey", "public", "\\"public\\".\\"document_echange\\""], "description": "ensure FK \\"document_echange_expediteur_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["document_echange_expediteur_id_fkey", "public", "\\"public\\".\\"document_echange\\""], "description": "verify FK \\"document_echange_expediteur_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.document_verification.document_verification_professionnel_id_fkey", "label": "Add foreign key \\"document_verification_professionnel_id_fkey\\" on \\"document_verification\\"", "target": {"id": "postgres", "details": {"name": "document_verification_professionnel_id_fkey", "table": "document_verification", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"document_verification\\"\\nADD CONSTRAINT \\"document_verification_professionnel_id_fkey\\"\\nFOREIGN KEY (\\"professionnel_id\\")\\nREFERENCES \\"public\\".\\"professionnel\\" (\\"id\\")\\nON DELETE CASCADE", "description": "add FK \\"document_verification_professionnel_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["document_verification_professionnel_id_fkey", "public", "\\"public\\".\\"document_verification\\""], "description": "ensure FK \\"document_verification_professionnel_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["document_verification_professionnel_id_fkey", "public", "\\"public\\".\\"document_verification\\""], "description": "verify FK \\"document_verification_professionnel_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.message.message_conversation_id_fkey", "label": "Add foreign key \\"message_conversation_id_fkey\\" on \\"message\\"", "target": {"id": "postgres", "details": {"name": "message_conversation_id_fkey", "table": "message", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"message\\"\\nADD CONSTRAINT \\"message_conversation_id_fkey\\"\\nFOREIGN KEY (\\"conversation_id\\")\\nREFERENCES \\"public\\".\\"conversation\\" (\\"id\\")\\nON DELETE CASCADE", "description": "add FK \\"message_conversation_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["message_conversation_id_fkey", "public", "\\"public\\".\\"message\\""], "description": "ensure FK \\"message_conversation_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["message_conversation_id_fkey", "public", "\\"public\\".\\"message\\""], "description": "verify FK \\"message_conversation_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.message.message_expediteur_id_fkey", "label": "Add foreign key \\"message_expediteur_id_fkey\\" on \\"message\\"", "target": {"id": "postgres", "details": {"name": "message_expediteur_id_fkey", "table": "message", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"message\\"\\nADD CONSTRAINT \\"message_expediteur_id_fkey\\"\\nFOREIGN KEY (\\"expediteur_id\\")\\nREFERENCES \\"public\\".\\"utilisateur\\" (\\"id\\")\\nON DELETE RESTRICT", "description": "add FK \\"message_expediteur_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["message_expediteur_id_fkey", "public", "\\"public\\".\\"message\\""], "description": "ensure FK \\"message_expediteur_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["message_expediteur_id_fkey", "public", "\\"public\\".\\"message\\""], "description": "verify FK \\"message_expediteur_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.paiement.paiement_abonnement_id_fkey", "label": "Add foreign key \\"paiement_abonnement_id_fkey\\" on \\"paiement\\"", "target": {"id": "postgres", "details": {"name": "paiement_abonnement_id_fkey", "table": "paiement", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"paiement\\"\\nADD CONSTRAINT \\"paiement_abonnement_id_fkey\\"\\nFOREIGN KEY (\\"abonnement_id\\")\\nREFERENCES \\"public\\".\\"abonnement\\" (\\"id\\")\\nON DELETE RESTRICT", "description": "add FK \\"paiement_abonnement_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["paiement_abonnement_id_fkey", "public", "\\"public\\".\\"paiement\\""], "description": "ensure FK \\"paiement_abonnement_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["paiement_abonnement_id_fkey", "public", "\\"public\\".\\"paiement\\""], "description": "verify FK \\"paiement_abonnement_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.professionnel.professionnel_utilisateur_id_fkey", "label": "Add foreign key \\"professionnel_utilisateur_id_fkey\\" on \\"professionnel\\"", "target": {"id": "postgres", "details": {"name": "professionnel_utilisateur_id_fkey", "table": "professionnel", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"professionnel\\"\\nADD CONSTRAINT \\"professionnel_utilisateur_id_fkey\\"\\nFOREIGN KEY (\\"utilisateur_id\\")\\nREFERENCES \\"public\\".\\"utilisateur\\" (\\"id\\")\\nON DELETE CASCADE", "description": "add FK \\"professionnel_utilisateur_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["professionnel_utilisateur_id_fkey", "public", "\\"public\\".\\"professionnel\\""], "description": "ensure FK \\"professionnel_utilisateur_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["professionnel_utilisateur_id_fkey", "public", "\\"public\\".\\"professionnel\\""], "description": "verify FK \\"professionnel_utilisateur_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.publication.publication_professionnel_id_fkey", "label": "Add foreign key \\"publication_professionnel_id_fkey\\" on \\"publication\\"", "target": {"id": "postgres", "details": {"name": "publication_professionnel_id_fkey", "table": "publication", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"publication\\"\\nADD CONSTRAINT \\"publication_professionnel_id_fkey\\"\\nFOREIGN KEY (\\"professionnel_id\\")\\nREFERENCES \\"public\\".\\"professionnel\\" (\\"id\\")\\nON DELETE CASCADE", "description": "add FK \\"publication_professionnel_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["publication_professionnel_id_fkey", "public", "\\"public\\".\\"publication\\""], "description": "ensure FK \\"publication_professionnel_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["publication_professionnel_id_fkey", "public", "\\"public\\".\\"publication\\""], "description": "verify FK \\"publication_professionnel_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.signalement.signalement_utilisateur_id_fkey", "label": "Add foreign key \\"signalement_utilisateur_id_fkey\\" on \\"signalement\\"", "target": {"id": "postgres", "details": {"name": "signalement_utilisateur_id_fkey", "table": "signalement", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"signalement\\"\\nADD CONSTRAINT \\"signalement_utilisateur_id_fkey\\"\\nFOREIGN KEY (\\"utilisateur_id\\")\\nREFERENCES \\"public\\".\\"utilisateur\\" (\\"id\\")\\nON DELETE RESTRICT", "description": "add FK \\"signalement_utilisateur_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["signalement_utilisateur_id_fkey", "public", "\\"public\\".\\"signalement\\""], "description": "ensure FK \\"signalement_utilisateur_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["signalement_utilisateur_id_fkey", "public", "\\"public\\".\\"signalement\\""], "description": "verify FK \\"signalement_utilisateur_id_fkey\\" exists"}], "operationClass": "additive"}, {"id": "foreignKey.verification.verification_professionnel_id_fkey", "label": "Add foreign key \\"verification_professionnel_id_fkey\\" on \\"verification\\"", "target": {"id": "postgres", "details": {"name": "verification_professionnel_id_fkey", "table": "verification", "schema": "public", "objectType": "foreignKey"}}, "execute": [{"sql": "ALTER TABLE \\"public\\".\\"verification\\"\\nADD CONSTRAINT \\"verification_professionnel_id_fkey\\"\\nFOREIGN KEY (\\"professionnel_id\\")\\nREFERENCES \\"public\\".\\"professionnel\\" (\\"id\\")\\nON DELETE CASCADE", "description": "add FK \\"verification_professionnel_id_fkey\\""}], "precheck": [{"sql": "SELECT NOT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["verification_professionnel_id_fkey", "public", "\\"public\\".\\"verification\\""], "description": "ensure FK \\"verification_professionnel_id_fkey\\" does not exist"}], "postcheck": [{"sql": "SELECT EXISTS (SELECT 1 AS \\"one\\" FROM \\"pg_constraint\\" AS \\"c\\" INNER JOIN \\"pg_namespace\\" AS \\"n\\" ON \\"n\\".\\"oid\\" = \\"c\\".\\"connamespace\\" WHERE (\\"c\\".\\"conname\\" = $1 AND \\"n\\".\\"nspname\\" = $2 AND \\"c\\".\\"conrelid\\" = to_regclass($3))) AS \\"result\\"", "params": ["verification_professionnel_id_fkey", "public", "\\"public\\".\\"verification\\""], "description": "verify FK \\"verification_professionnel_id_fkey\\" exists"}], "operationClass": "additive"}]
\.


--
-- Data for Name: marker; Type: TABLE DATA; Schema: prisma_contract; Owner: -
--

COPY prisma_contract.marker (space, core_hash, profile_hash, contract_json, canonical_version, updated_at, app_tag, meta, invariants) FROM stdin;
app	5cb0fc262450ed95c9e9487dcfcdc9434112a3f4659b7c26f1b3b2294867a099	3916f444a8a17ad749191acf9e08dad97d1a327b88c2f1d45d12f240296aa8b2	\N	\N	2026-10-05 01:08:24.581308+00	\N	{}	{}
\.


--
-- Data for Name: abonnement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.abonnement (date_debut, date_fin, formule_id, id, statut, utilisateur_id) FROM stdin;
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (action, date, id, informations_complementaires, utilisateur_id) FROM stdin;
\.


--
-- Data for Name: conversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversation (date_creation, id, professionnel_id, statut, voyageur_id) FROM stdin;
\.


--
-- Data for Name: document_echange; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_echange (conversation_id, date_envoi, expediteur_id, fichier, id) FROM stdin;
\.


--
-- Data for Name: document_verification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_verification (created_at, fichier, id, professionnel_id, statut, type_document) FROM stdin;
\.


--
-- Data for Name: formule_abonnement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.formule_abonnement (duree, id, nom, prix, statut, type_utilisateur) FROM stdin;
MENSUEL	formule-voyageur-mensuel	Abonnement Voyageur Mensuel	5000	ACTIF	VOYAGEUR
ANNUEL	formule-voyageur-annuel	Abonnement Voyageur Annuel	50000	ACTIF	VOYAGEUR
MENSUEL	formule-professionnel-mensuel	Abonnement Professionnel Mensuel	20000	ACTIF	PROFESSIONNEL
ANNUEL	formule-professionnel-annuel	Abonnement Professionnel Annuel	200000	ACTIF	PROFESSIONNEL
\.


--
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message (contenu, conversation_id, date_envoi, expediteur_id, id, statut) FROM stdin;
\.


--
-- Data for Name: paiement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.paiement (abonnement_id, date_confirmation, date_creation, id, montant, moyen_paiement, reference, statut) FROM stdin;
\.


--
-- Data for Name: professionnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.professionnel (created_at, description, id, informations_professionnelles, nom_structure, statut_verification, utilisateur_id) FROM stdin;
\.


--
-- Data for Name: publication; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.publication (contenu, date_creation, date_publication, id, professionnel_id, statut, titre) FROM stdin;
\.


--
-- Data for Name: signalement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.signalement (cible_id, date_creation, description, id, motif, statut, type_cible, utilisateur_id) FROM stdin;
\.


--
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utilisateur (created_at, email, id, mot_de_passe, nom, prenom, role, statut, telephone) FROM stdin;
2026-10-05 01:32:20.64+00	admin@syllavoyage.com	00e50e24-16bd-4cf7-b144-a1d6297e1874	$2b$10$SFKTHWxJYauZW13eB4LUxehqc4VE8O8iYOF.Ql.wSWN5hGL9tCVei	Super	Admin	ADMIN	ACTIF	+221770000001
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification (commentaire, date_debut, date_decision, id, professionnel_id, statut) FROM stdin;
\.


--
-- Name: ledger_id_seq; Type: SEQUENCE SET; Schema: prisma_contract; Owner: -
--

SELECT pg_catalog.setval('prisma_contract.ledger_id_seq', 1, true);


--
-- Name: contract contract_pkey; Type: CONSTRAINT; Schema: prisma_contract; Owner: -
--

ALTER TABLE ONLY prisma_contract.contract
    ADD CONSTRAINT contract_pkey PRIMARY KEY (core_hash);


--
-- Name: ledger ledger_pkey; Type: CONSTRAINT; Schema: prisma_contract; Owner: -
--

ALTER TABLE ONLY prisma_contract.ledger
    ADD CONSTRAINT ledger_pkey PRIMARY KEY (id);


--
-- Name: marker marker_pkey; Type: CONSTRAINT; Schema: prisma_contract; Owner: -
--

ALTER TABLE ONLY prisma_contract.marker
    ADD CONSTRAINT marker_pkey PRIMARY KEY (space);


--
-- Name: abonnement abonnement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonnement
    ADD CONSTRAINT abonnement_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: conversation conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_pkey PRIMARY KEY (id);


--
-- Name: document_echange document_echange_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_echange
    ADD CONSTRAINT document_echange_pkey PRIMARY KEY (id);


--
-- Name: document_verification document_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_verification
    ADD CONSTRAINT document_verification_pkey PRIMARY KEY (id);


--
-- Name: formule_abonnement formule_abonnement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formule_abonnement
    ADD CONSTRAINT formule_abonnement_pkey PRIMARY KEY (id);


--
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id);


--
-- Name: paiement paiement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiement
    ADD CONSTRAINT paiement_pkey PRIMARY KEY (id);


--
-- Name: paiement paiement_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiement
    ADD CONSTRAINT paiement_reference_key UNIQUE (reference);


--
-- Name: professionnel professionnel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professionnel
    ADD CONSTRAINT professionnel_pkey PRIMARY KEY (id);


--
-- Name: professionnel professionnel_utilisateur_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professionnel
    ADD CONSTRAINT professionnel_utilisateur_id_key UNIQUE (utilisateur_id);


--
-- Name: publication publication_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication
    ADD CONSTRAINT publication_pkey PRIMARY KEY (id);


--
-- Name: signalement signalement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalement
    ADD CONSTRAINT signalement_pkey PRIMARY KEY (id);


--
-- Name: utilisateur utilisateur_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_role_key UNIQUE (email, role);

CREATE UNIQUE INDEX IF NOT EXISTS utilisateur_telephone_role_idx ON public.utilisateur (telephone, role) WHERE telephone IS NOT NULL;


--
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: abonnement_formule_id_idx_885a400f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX abonnement_formule_id_idx_885a400f ON public.abonnement USING btree (formule_id);


--
-- Name: abonnement_utilisateur_id_idx_afedb02c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX abonnement_utilisateur_id_idx_afedb02c ON public.abonnement USING btree (utilisateur_id);


--
-- Name: audit_log_utilisateur_id_idx_afedb02c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_utilisateur_id_idx_afedb02c ON public.audit_log USING btree (utilisateur_id);


--
-- Name: conversation_professionnel_id_idx_015ea5a7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversation_professionnel_id_idx_015ea5a7 ON public.conversation USING btree (professionnel_id);


--
-- Name: conversation_voyageur_id_idx_09dceabd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversation_voyageur_id_idx_09dceabd ON public.conversation USING btree (voyageur_id);


--
-- Name: document_echange_conversation_id_idx_0c3639df; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_echange_conversation_id_idx_0c3639df ON public.document_echange USING btree (conversation_id);


--
-- Name: document_echange_expediteur_id_idx_883054ea; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_echange_expediteur_id_idx_883054ea ON public.document_echange USING btree (expediteur_id);


--
-- Name: document_verification_professionnel_id_idx_015ea5a7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_verification_professionnel_id_idx_015ea5a7 ON public.document_verification USING btree (professionnel_id);


--
-- Name: message_conversation_id_idx_0c3639df; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_conversation_id_idx_0c3639df ON public.message USING btree (conversation_id);


--
-- Name: message_expediteur_id_idx_883054ea; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_expediteur_id_idx_883054ea ON public.message USING btree (expediteur_id);


--
-- Name: paiement_abonnement_id_idx_038e7437; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX paiement_abonnement_id_idx_038e7437 ON public.paiement USING btree (abonnement_id);


--
-- Name: publication_professionnel_id_idx_015ea5a7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX publication_professionnel_id_idx_015ea5a7 ON public.publication USING btree (professionnel_id);


--
-- Name: signalement_utilisateur_id_idx_afedb02c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX signalement_utilisateur_id_idx_afedb02c ON public.signalement USING btree (utilisateur_id);


--
-- Name: verification_professionnel_id_idx_015ea5a7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX verification_professionnel_id_idx_015ea5a7 ON public.verification USING btree (professionnel_id);


--
-- Name: abonnement abonnement_formule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonnement
    ADD CONSTRAINT abonnement_formule_id_fkey FOREIGN KEY (formule_id) REFERENCES public.formule_abonnement(id) ON DELETE RESTRICT;


--
-- Name: abonnement abonnement_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonnement
    ADD CONSTRAINT abonnement_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id) ON DELETE RESTRICT;


--
-- Name: audit_log audit_log_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id) ON DELETE SET NULL;


--
-- Name: conversation conversation_professionnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_professionnel_id_fkey FOREIGN KEY (professionnel_id) REFERENCES public.professionnel(id) ON DELETE RESTRICT;


--
-- Name: conversation conversation_voyageur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_voyageur_id_fkey FOREIGN KEY (voyageur_id) REFERENCES public.utilisateur(id) ON DELETE RESTRICT;


--
-- Name: document_echange document_echange_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_echange
    ADD CONSTRAINT document_echange_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversation(id) ON DELETE CASCADE;


--
-- Name: document_echange document_echange_expediteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_echange
    ADD CONSTRAINT document_echange_expediteur_id_fkey FOREIGN KEY (expediteur_id) REFERENCES public.utilisateur(id) ON DELETE RESTRICT;


--
-- Name: document_verification document_verification_professionnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_verification
    ADD CONSTRAINT document_verification_professionnel_id_fkey FOREIGN KEY (professionnel_id) REFERENCES public.professionnel(id) ON DELETE CASCADE;


--
-- Name: message message_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversation(id) ON DELETE CASCADE;


--
-- Name: message message_expediteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_expediteur_id_fkey FOREIGN KEY (expediteur_id) REFERENCES public.utilisateur(id) ON DELETE RESTRICT;


--
-- Name: paiement paiement_abonnement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiement
    ADD CONSTRAINT paiement_abonnement_id_fkey FOREIGN KEY (abonnement_id) REFERENCES public.abonnement(id) ON DELETE RESTRICT;


--
-- Name: professionnel professionnel_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professionnel
    ADD CONSTRAINT professionnel_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id) ON DELETE CASCADE;


--
-- Name: publication publication_professionnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication
    ADD CONSTRAINT publication_professionnel_id_fkey FOREIGN KEY (professionnel_id) REFERENCES public.professionnel(id) ON DELETE CASCADE;


--
-- Name: signalement signalement_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signalement
    ADD CONSTRAINT signalement_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateur(id) ON DELETE RESTRICT;


--
-- Name: verification verification_professionnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_professionnel_id_fkey FOREIGN KEY (professionnel_id) REFERENCES public.professionnel(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict OdH86Fu1hjkfRnWF8u6DxccwB8zI8DxukEGldoHHykkYXamcjaDcB3zaCoVBhaX

