import pandas as pd
import numpy as np
from datetime import datetime
import os
from sklearn.model_selection import train_test_split

PROHIBITED_SYMBOLS = ['$', '%', '#', '@', '!', '^', '&', '*', '(', ')', '-', '+', '=', '{', '}', '[', ']', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '?', '/','~','`', ',', '…', '"', '"', ''', ''', '—', '–']
KEEP_COLS = ['statement']

os.makedirs("../datasets", exist_ok=True)
os.makedirs("../results", exist_ok=True)

COLUMNS = ['id', 'label', 'statement', 'subject', 'speaker', 'job_title', 'state', 'party', 
           'barely_true_counts', 'false_counts', 'half_true_counts', 'mostly_true_counts', 
           'pants_on_fire_counts', 'context']
LABEL_MAP = {'pants-fire': 1, 'false': 1, 'barely-true': 1, 'half-true': 0, 'mostly-true': 0, 'true': 0}

def normalize_text(text):
    text = text.lower()
    for char in PROHIBITED_SYMBOLS:
        text = text.replace(char, " ")
    return text

def preprocess(path_true="../datasets/train.tsv", path_fake="../datasets/valid.tsv"):
    true_df = pd.read_csv(path_true, sep='\t', header=None, names=COLUMNS).dropna(subset=['statement'])
    fake_df = pd.read_csv(path_fake, sep='\t', header=None, names=COLUMNS).dropna(subset=['statement'])
    
    true_df = true_df[KEEP_COLS + ['label']]
    fake_df = fake_df[KEEP_COLS + ['label']]

    true_df['label'] = true_df['label'].map(LABEL_MAP)
    fake_df['label'] = fake_df['label'].map(LABEL_MAP)
    
    true_df = true_df.dropna(subset=['label']).copy()
    fake_df = fake_df.dropna(subset=['label']).copy()
    
    true_df = true_df.rename(columns={'statement': 'title'})
    fake_df = fake_df.rename(columns={'statement': 'title'})
    
    true_df['label'] = true_df['label'].astype(int)
    fake_df['label'] = fake_df['label'].astype(int)
    
    return true_df, fake_df

def normalization(true_df, fake_df):
    
    for df in [true_df, fake_df]:
        df['title'] = df['title'].str.lower()

        for char in PROHIBITED_SYMBOLS:
            df['title'] = df['title'].str.replace(char, " ", regex=False)

    return true_df, fake_df

def lemmatization(true_df, fake_df):
    return true_df, fake_df

def split(true_df, fake_df):
    test_df = pd.read_csv("../datasets/test.tsv", sep='\t', header=None, names=COLUMNS).dropna(subset=['statement'])
    test_df = test_df[KEEP_COLS + ['label']]
    test_df['label'] = test_df['label'].map(LABEL_MAP)
    test_df = test_df.dropna(subset=['label']).copy()
    test_df = test_df.rename(columns={'statement': 'title'})
    test_df['label'] = test_df['label'].astype(int)
    
    df = pd.concat([true_df, fake_df], ignore_index=True)
    df = df.drop_duplicates(subset=['title'], keep='first').reset_index(drop=True)
    train_val, _ = train_test_split(df, test_size=0.2, random_state=1, stratify=df['label'])
    train, val = train_test_split(train_val, test_size=0.125, random_state=1, stratify=train_val['label'])

    train.to_csv("../results/train.csv", index=False)
    test_df.to_csv("../results/test.csv", index=False)
    val.to_csv("../results/val.csv", index=False)

if __name__ == "__main__":
    true_df, fake_df = preprocess()
    true_df, fake_df = normalization(true_df, fake_df)
    true_df, fake_df = lemmatization(true_df, fake_df)
    split(true_df, fake_df)