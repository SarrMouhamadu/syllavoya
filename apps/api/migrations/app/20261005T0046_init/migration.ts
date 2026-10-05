#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5cb0fc262450ed95c9e9487dcfcdc9434112a3f4659b7c26f1b3b2294867a099/contract';
import endContract from '../../snapshots/5cb0fc262450ed95c9e9487dcfcdc9434112a3f4659b7c26f1b3b2294867a099/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'abonnement',
        columns: [
          col('date_debut', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('date_fin', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('formule_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('statut', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('utilisateur_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'audit_log',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('date', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('informations_complementaires', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('utilisateur_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'conversation',
        columns: [
          col('date_creation', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('professionnel_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('statut', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('voyageur_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'document_echange',
        columns: [
          col('conversation_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('date_envoi', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('expediteur_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('fichier', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'document_verification',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('fichier', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('professionnel_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('statut', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type_document', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'formule_abonnement',
        columns: [
          col('duree', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nom', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('prix', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('statut', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type_utilisateur', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'message',
        columns: [
          col('contenu', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('conversation_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('date_envoi', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('expediteur_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('statut', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'paiement',
        columns: [
          col('abonnement_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('date_confirmation', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('date_creation', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('montant', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('moyen_paiement', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('statut', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'professionnel',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('informations_professionnelles', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nom_structure', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('statut_verification', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('utilisateur_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'publication',
        columns: [
          col('contenu', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('date_creation', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('date_publication', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('professionnel_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('statut', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('titre', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'signalement',
        columns: [
          col('cible_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('date_creation', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('motif', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('statut', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type_cible', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('utilisateur_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'utilisateur',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('mot_de_passe', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nom', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('prenom', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('statut', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('telephone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'verification',
        columns: [
          col('commentaire', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('date_debut', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('date_decision', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('professionnel_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('statut', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'paiement',
        constraint: 'paiement_reference_key',
        columns: ['reference'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'professionnel',
        constraint: 'professionnel_utilisateur_id_key',
        columns: ['utilisateur_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'utilisateur',
        constraint: 'utilisateur_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'abonnement',
        index: 'abonnement_formule_id_idx_885a400f',
        columns: ['formule_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'abonnement',
        index: 'abonnement_utilisateur_id_idx_afedb02c',
        columns: ['utilisateur_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_log',
        index: 'audit_log_utilisateur_id_idx_afedb02c',
        columns: ['utilisateur_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversation',
        index: 'conversation_professionnel_id_idx_015ea5a7',
        columns: ['professionnel_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversation',
        index: 'conversation_voyageur_id_idx_09dceabd',
        columns: ['voyageur_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'document_echange',
        index: 'document_echange_conversation_id_idx_0c3639df',
        columns: ['conversation_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'document_echange',
        index: 'document_echange_expediteur_id_idx_883054ea',
        columns: ['expediteur_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'document_verification',
        index: 'document_verification_professionnel_id_idx_015ea5a7',
        columns: ['professionnel_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'message',
        index: 'message_conversation_id_idx_0c3639df',
        columns: ['conversation_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'message',
        index: 'message_expediteur_id_idx_883054ea',
        columns: ['expediteur_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'paiement',
        index: 'paiement_abonnement_id_idx_038e7437',
        columns: ['abonnement_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'publication',
        index: 'publication_professionnel_id_idx_015ea5a7',
        columns: ['professionnel_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'signalement',
        index: 'signalement_utilisateur_id_idx_afedb02c',
        columns: ['utilisateur_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'verification',
        index: 'verification_professionnel_id_idx_015ea5a7',
        columns: ['professionnel_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'abonnement',
        foreignKey: {
          name: 'abonnement_utilisateur_id_fkey',
          columns: ['utilisateur_id'],
          references: { schema: 'public', table: 'utilisateur', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'abonnement',
        foreignKey: {
          name: 'abonnement_formule_id_fkey',
          columns: ['formule_id'],
          references: { schema: 'public', table: 'formule_abonnement', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'audit_log',
        foreignKey: {
          name: 'audit_log_utilisateur_id_fkey',
          columns: ['utilisateur_id'],
          references: { schema: 'public', table: 'utilisateur', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'conversation',
        foreignKey: {
          name: 'conversation_voyageur_id_fkey',
          columns: ['voyageur_id'],
          references: { schema: 'public', table: 'utilisateur', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'conversation',
        foreignKey: {
          name: 'conversation_professionnel_id_fkey',
          columns: ['professionnel_id'],
          references: { schema: 'public', table: 'professionnel', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'document_echange',
        foreignKey: {
          name: 'document_echange_conversation_id_fkey',
          columns: ['conversation_id'],
          references: { schema: 'public', table: 'conversation', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'document_echange',
        foreignKey: {
          name: 'document_echange_expediteur_id_fkey',
          columns: ['expediteur_id'],
          references: { schema: 'public', table: 'utilisateur', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'document_verification',
        foreignKey: {
          name: 'document_verification_professionnel_id_fkey',
          columns: ['professionnel_id'],
          references: { schema: 'public', table: 'professionnel', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'message',
        foreignKey: {
          name: 'message_conversation_id_fkey',
          columns: ['conversation_id'],
          references: { schema: 'public', table: 'conversation', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'message',
        foreignKey: {
          name: 'message_expediteur_id_fkey',
          columns: ['expediteur_id'],
          references: { schema: 'public', table: 'utilisateur', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'paiement',
        foreignKey: {
          name: 'paiement_abonnement_id_fkey',
          columns: ['abonnement_id'],
          references: { schema: 'public', table: 'abonnement', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'professionnel',
        foreignKey: {
          name: 'professionnel_utilisateur_id_fkey',
          columns: ['utilisateur_id'],
          references: { schema: 'public', table: 'utilisateur', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'publication',
        foreignKey: {
          name: 'publication_professionnel_id_fkey',
          columns: ['professionnel_id'],
          references: { schema: 'public', table: 'professionnel', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'signalement',
        foreignKey: {
          name: 'signalement_utilisateur_id_fkey',
          columns: ['utilisateur_id'],
          references: { schema: 'public', table: 'utilisateur', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'verification',
        foreignKey: {
          name: 'verification_professionnel_id_fkey',
          columns: ['professionnel_id'],
          references: { schema: 'public', table: 'professionnel', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
